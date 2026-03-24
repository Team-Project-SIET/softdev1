/**
 * Logistics Routes
 * GET /logistics/pending - ดูงานที่รอ Driver มอบหมาย
 * PATCH /logistics/:id/assign - Admin มอบหมาย Driver
 * PATCH /logistics/:id/update-status - Driver อัปเดตสถานะ
 */

import Elysia, { t } from 'elysia';
import { db } from '@/db';
import {
  orders,
  deliveryAssignments,
  driverLocationHistory,
  drivers,
  users,
} from '@/db/schema';
import { eq, and, desc, or, count } from 'drizzle-orm';

// Types
interface AssignDriverRequest {
  driverId: string;
  assignmentType: 'PICKUP' | 'DELIVERY' | 'BOTH';
  priority?: number;
  notes?: string;
}

interface UpdateDeliveryStatusRequest {
  status: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  photoUrl?: string;
  signature?: string;
}

export const logisticsRoutes = new Elysia({ prefix: '/api/logistics' })

  // ============================================
  // GET /pending - ดูงานที่รอ Driver มอบหมาย
  // ============================================
  .get(
    '/pending',
    async ({ query }) => {
      try {
        const limit = Math.min(query.limit || 20, 100);
        const offset = ((query.page || 1) - 1) * limit;

        // Get orders with pending deliveries
        const conditions = [
          or(
            eq(orders.status, 'READY'),
            eq(orders.status, 'PENDING')
          ),
        ];

        // Get count
        const [countResult] = await db
          .select({ count: count() })
          .from(orders)
          .where(and(...conditions));

        // Get pending orders with customer info
        const pendingOrders = await db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            customerId: orders.customerId,
            customerName: users.fullName,
            customerPhone: users.phone,
            totalAmount: orders.totalAmount,
            status: orders.status,
            deliveryType: orders.deliveryType,
            estimatedReadyDate: orders.estimatedReadyDate,
            createdAt: orders.createdAt,
          })
          .from(orders)
          .innerJoin(users, eq(orders.customerId, users.id))
          .where(and(...conditions))
          .orderBy(orders.receivedDate)
          .limit(limit)
          .offset(offset);

        console.log(`[LOGISTICS] Pending jobs: ${pendingOrders.length}`);

        return {
          success: true,
          data: pendingOrders,
          pagination: {
            page: query.page || 1,
            limit,
            total: countResult?.count || 0,
            pages: Math.ceil((countResult?.count || 0) / limit),
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[LOGISTICS] Pending error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch pending jobs',
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      }),
    }
  )

  // ============================================
  // PATCH /:id/assign - Admin มอบหมาย Driver
  // ============================================
  .patch(
    '/:orderId/assign',
    async ({ params, body }) => {
      try {
        // Verify order exists
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, params.orderId));

        if (!order) {
          return {
            success: false,
            error: 'Order not found',
            timestamp: new Date().toISOString(),
          };
        }

        // Verify driver exists and is active
        const [driver] = await db
          .select()
          .from(drivers)
          .where(eq(drivers.id, body.driverId));

        if (!driver) {
          return {
            success: false,
            error: 'Driver not found',
            timestamp: new Date().toISOString(),
          };
        }

        if (!driver.isActive || !driver.isAvailable) {
          return {
            success: false,
            error: 'Driver is not available',
            timestamp: new Date().toISOString(),
          };
        }

        // Create or update delivery assignment
        const [assignment] = await db
          .insert(deliveryAssignments)
          .values({
            orderId: params.orderId,
            driverId: body.driverId,
            assignmentType: body.assignmentType,
            status: 'ASSIGNED',
            priority: body.priority || 1,
          })
          .onConflictDoUpdate({
            target: deliveryAssignments.orderId,
            set: {
              driverId: body.driverId,
              assignmentType: body.assignmentType,
              status: 'ASSIGNED',
              priority: body.priority || 1,
            },
          })
          .returning();

        // Update order with driver
        await db
          .update(orders)
          .set({
            driverId: body.driverId,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, params.orderId));

        // Get driver info
        const [driverUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, driver.userId));

        console.log(`[LOGISTICS] Order assigned: ${params.orderId} -> ${body.driverId}`);

        return {
          success: true,
          data: {
            assignmentId: assignment.id,
            orderId: params.orderId,
            driverId: body.driverId,
            driverName: driverUser?.fullName,
            driverPhone: driverUser?.phone,
            assignmentType: body.assignmentType,
            status: assignment.status,
            priority: assignment.priority,
            assignedAt: assignment.createdAt,
          },
          message: 'Driver assigned successfully',
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[LOGISTICS] Assign error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to assign driver',
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      body: t.Object({
        driverId: t.String(),
        assignmentType: t.Union([
          t.Literal('PICKUP'),
          t.Literal('DELIVERY'),
          t.Literal('BOTH'),
        ]),
        priority: t.Optional(t.Number({ minimum: 1, maximum: 5 })),
        notes: t.Optional(t.String()),
      }),
    }
  )

  // ============================================
  // PATCH /:id/update-status - Driver อัปเดตสถานะ
  // ============================================
  .patch(
    '/:assignmentId/update-status',
    async ({ params, body }) => {
      try {
        // Get assignment
        const [assignment] = await db
          .select()
          .from(deliveryAssignments)
          .where(eq(deliveryAssignments.id, params.assignmentId));

        if (!assignment) {
          return {
            success: false,
            error: 'Assignment not found',
            timestamp: new Date().toISOString(),
          };
        }

        // Update assignment status
        const [updated] = await db
          .update(deliveryAssignments)
          .set({
            status: body.status,
            actualPickupTime: body.status === 'PICKED_UP' ? new Date() : assignment.actualPickupTime,
            actualDeliveryTime: body.status === 'COMPLETED' ? new Date() : assignment.actualDeliveryTime,
            updatedAt: new Date(),
          })
          .where(eq(deliveryAssignments.id, params.assignmentId))
          .returning();

        // Record location if provided
        if (body.latitude !== undefined && body.longitude !== undefined) {
          await db
            .insert(driverLocationHistory)
            .values({
              driverId: assignment.driverId,
              assignmentId: params.assignmentId,
              latitude: body.latitude,
              longitude: body.longitude,
              recordedAt: new Date(),
            });
        }

        // If completed, update order status to COMPLETED
        if (body.status === 'COMPLETED') {
          await db
            .update(orders)
            .set({
              status: 'COMPLETED',
              actualDeliveryDate: new Date(),
              completedDate: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(orders.id, assignment.orderId));
        }

        console.log(`[LOGISTICS] Status updated: ${params.assignmentId} -> ${body.status}`);

        return {
          success: true,
          data: {
            assignmentId: updated.id,
            orderId: updated.orderId,
            previousStatus: assignment.status,
            newStatus: updated.status,
            location: body.latitude && body.longitude ? {
              latitude: body.latitude,
              longitude: body.longitude,
            } : null,
            updatedAt: updated.updatedAt,
          },
          message: `Delivery status updated to ${body.status}`,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[LOGISTICS] Update status error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update delivery status',
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      body: t.Object({
        status: t.String(),
        latitude: t.Optional(t.Number()),
        longitude: t.Optional(t.Number()),
        notes: t.Optional(t.String()),
        photoUrl: t.Optional(t.String()),
        signature: t.Optional(t.String()),
      }),
    }
  )

  // ============================================
  // GET /driver/:driverId/assignments - Driver's assignments
  // ============================================
  .get(
    '/driver/:driverId/assignments',
    async ({ params, query }) => {
      try {
        // Get driver info
        const [driver] = await db
          .select()
          .from(drivers)
          .where(eq(drivers.id, params.driverId));

        if (!driver) {
          return {
            success: false,
            error: 'Driver not found',
            timestamp: new Date().toISOString(),
          };
        }

        // Get assignments for driver
        const limit = Math.min(query.limit || 20, 100);
        const offset = ((query.page || 1) - 1) * limit;

        const conditions = [
          eq(deliveryAssignments.driverId, params.driverId),
          query.status ? eq(deliveryAssignments.status, query.status) : undefined,
        ].filter(Boolean);

        // Get count
        const [countResult] = await db
          .select({ count: count() })
          .from(deliveryAssignments)
          .where(and(...conditions));

        // Get assignments with order details
        const assignments = await db
          .select({
            id: deliveryAssignments.id,
            orderId: deliveryAssignments.orderId,
            orderNumber: orders.orderNumber,
            customerName: users.fullName,
            customerPhone: users.phone,
            status: deliveryAssignments.status,
            assignmentType: deliveryAssignments.assignmentType,
            priority: deliveryAssignments.priority,
            estimatedPickupTime: deliveryAssignments.estimatedPickupTime,
            estimatedDeliveryTime: deliveryAssignments.estimatedDeliveryTime,
            actualPickupTime: deliveryAssignments.actualPickupTime,
            actualDeliveryTime: deliveryAssignments.actualDeliveryTime,
          })
          .from(deliveryAssignments)
          .innerJoin(orders, eq(deliveryAssignments.orderId, orders.id))
          .innerJoin(users, eq(orders.customerId, users.id))
          .where(and(...conditions))
          .orderBy(desc(deliveryAssignments.priority), deliveryAssignments.estimatedPickupTime)
          .limit(limit)
          .offset(offset);

        console.log(`[LOGISTICS] Driver assignments fetched: ${params.driverId} -> ${assignments.length}`);

        return {
          success: true,
          data: {
            driver: {
              id: driver.id,
              rating: driver.averageRating,
              totalDeliveries: driver.totalDeliveries,
              successRate: driver.successRate,
            },
            assignments,
          },
          pagination: {
            page: query.page || 1,
            limit,
            total: countResult?.count || 0,
            pages: Math.ceil((countResult?.count || 0) / limit),
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[LOGISTICS] Driver assignments error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch driver assignments',
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        status: t.Optional(t.String()),
      }),
    }
  )

  // ============================================
  // GET /assignment/:assignmentId/track - Real-time tracking
  // ============================================
  .get(
    '/assignment/:assignmentId/track',
    async ({ params }) => {
      try {
        const [assignment] = await db
          .select()
          .from(deliveryAssignments)
          .where(eq(deliveryAssignments.id, params.assignmentId));

        if (!assignment) {
          return {
            success: false,
            error: 'Assignment not found',
            timestamp: new Date().toISOString(),
          };
        }

        // Get latest location
        const [latestLocation] = await db
          .select()
          .from(driverLocationHistory)
          .where(eq(driverLocationHistory.assignmentId, params.assignmentId))
          .orderBy(desc(driverLocationHistory.recordedAt))
          .limit(1);

        // Get order details
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, assignment.orderId));

        console.log(`[LOGISTICS] Tracking fetched: ${params.assignmentId}`);

        return {
          success: true,
          data: {
            assignment: {
              status: assignment.status,
              estimatedDeliveryTime: assignment.estimatedDeliveryTime,
            },
            currentLocation: latestLocation ? {
              latitude: latestLocation.latitude,
              longitude: latestLocation.longitude,
              accuracy: latestLocation.accuracy,
              speed: latestLocation.speed,
              recordedAt: latestLocation.recordedAt,
            } : null,
            order: {
              orderNumber: order?.orderNumber,
              totalAmount: order?.totalAmount,
            },
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[LOGISTICS] Tracking error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch tracking info',
          timestamp: new Date().toISOString(),
        };
      }
    }
  );

export default logisticsRoutes;
