/**
 * Order Management Routes
 * POST /orders - Admin สร้าง Order ใหม่
 * GET /orders - List รายการ (รองรับ Filter)
 * GET /orders/:id - ดูรายละเอียด Order
 * PATCH /orders/:id/status - อัปเดตสถานะงาน
 * GET /orders/customer/:lineId - LINE OA ดึงสถานะงานของลูกค้า
 */

import Elysia, { t } from 'elysia';
import { db } from '@/db';
import {
  orders,
  orderItems,
  users,
  orderWorkflowHistory,
  deliveryAssignments,
  payments,
} from '@/db/schema';
import {
  eq,
  and,
  or,
  desc,
  count,
  gte,
  lte,
  ne,
} from 'drizzle-orm';

// Types
interface CreateOrderRequest {
  customerId?: string;
  customerEmail?: string;
  items: Array<{
    itemType: string;
    quantity: number;
    color?: string;
    specialInstructions?: string;
    unitPrice: number;
  }>;
  deliveryType: 'WALK_IN' | 'PICKUP' | 'DELIVERY';
  specialNotes?: string;
  phone?: string;
  address?: string;
}

interface UpdateOrderStatusRequest {
  status: 'PENDING' | 'WASHING' | 'PACKING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

// Helper function
function generateOrderNumber(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const orderRoutes = new Elysia({ prefix: '/api/orders' })

  // ============================================
  // POST /orders - Admin สร้าง Order ใหม่
  // ============================================
  .post(
    '/',
    async ({ body }) => {
      try {
        // Find or create customer
        let customerId: string;

        if (body.customerId) {
          const [customer] = await db
            .select()
            .from(users)
            .where(eq(users.id, body.customerId));

          if (!customer) {
            return {
              success: false,
              error: 'Customer not found',
              timestamp: new Date().toISOString(),
            };
          }
          customerId = customer.id;
        } else if (body.customerEmail) {
          const [customer] = await db
            .select()
            .from(users)
            .where(eq(users.email, body.customerEmail));

          if (customer) {
            customerId = customer.id;
          } else {
            // Create new customer
            const [newCustomer] = await db
              .insert(users)
              .values({
                email: body.customerEmail,
                fullName: body.customerEmail.split('@')[0],
                phone: body.phone,
                role: 'CUSTOMER',
                isActive: true,
                membershipLevel: 'STANDARD',
                loyaltyPoints: 0,
              })
              .returning();

            customerId = newCustomer.id;
          }
        } else {
          return {
            success: false,
            error: 'customerId or customerEmail is required',
            timestamp: new Date().toISOString(),
          };
        }

        // Calculate totals
        const subtotal = body.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        );
        const tax = subtotal * 0.07; // 7% VAT
        const totalAmount = subtotal + tax;

        // Create order
        const [newOrder] = await db
          .insert(orders)
          .values({
            customerId,
            orderNumber: generateOrderNumber(),
            totalAmount,
            deliveryType: body.deliveryType,
            status: 'PENDING',
            subtotal,
            tax,
            discount: 0,
            loyaltyPointsEarned: Math.floor(totalAmount / 100),
            receivedDate: new Date(),
            estimatedReadyDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            specialNotes: body.specialNotes,
          })
          .returning();

        // Create order items
        const createdItems = await db
          .insert(orderItems)
          .values(
            body.items.map(item => ({
              orderId: newOrder.id,
              itemType: item.itemType,
              quantity: item.quantity,
              color: item.color,
              specialInstructions: item.specialInstructions,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            }))
          )
          .returning();

        // Log workflow
        await db
          .insert(orderWorkflowHistory)
          .values({
            orderId: newOrder.id,
            fromStatus: 'CREATED',
            toStatus: 'PENDING',
            reason: 'Order created',
          });

        console.log(`[ORDERS] Order created: ${newOrder.orderNumber}`);

        return {
          success: true,
          data: {
            id: newOrder.id,
            orderNumber: newOrder.orderNumber,
            customerId,
            totalAmount: newOrder.totalAmount,
            status: newOrder.status,
            deliveryType: newOrder.deliveryType,
            itemCount: createdItems.length,
            estimatedReadyDate: newOrder.estimatedReadyDate,
            createdAt: newOrder.createdAt,
          },
          message: 'Order created successfully',
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[ORDERS] Create error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create order',
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      body: t.Object({
        customerId: t.Optional(t.String()),
        customerEmail: t.Optional(t.String({ format: 'email' })),
        items: t.Array(
          t.Object({
            itemType: t.String(),
            quantity: t.Number({ minimum: 1 }),
            color: t.Optional(t.String()),
            specialInstructions: t.Optional(t.String()),
            unitPrice: t.Number({ minimum: 0 }),
          })
        ),
        deliveryType: t.Union([
          t.Literal('WALK_IN'),
          t.Literal('PICKUP'),
          t.Literal('DELIVERY'),
        ]),
        specialNotes: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        address: t.Optional(t.String()),
      }),
    }
  )

  // ============================================
  // GET /orders - List รายการ (รองรับ Filter)
  // ============================================
  .get(
    '/',
    async ({ query }) => {
      try {
        const page = query.page || 1;
        const limit = Math.min(query.limit || 20, 100);
        const offset = (page - 1) * limit;

        // Build where conditions
        const conditions: any[] = [];

        if (query.status) {
          conditions.push(eq(orders.status, query.status));
        }

        if (query.customerId) {
          conditions.push(eq(orders.customerId, query.customerId));
        }

        if (query.deliveryType) {
          conditions.push(eq(orders.deliveryType, query.deliveryType));
        }

        if (query.from && query.to) {
          conditions.push(
            and(
              gte(orders.receivedDate, new Date(query.from)),
              lte(orders.receivedDate, new Date(query.to))
            )
          );
        }

        // Get total count
        const [countResult] = await db
          .select({ count: count() })
          .from(orders)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        // Get paginated results with customer info
        const results = await db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            customerId: orders.customerId,
            customerName: users.fullName,
            customerPhone: users.phone,
            totalAmount: orders.totalAmount,
            status: orders.status,
            deliveryType: orders.deliveryType,
            receivedDate: orders.receivedDate,
            estimatedReadyDate: orders.estimatedReadyDate,
            completedDate: orders.completedDate,
          })
          .from(orders)
          .innerJoin(users, eq(orders.customerId, users.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(orders.receivedDate))
          .limit(limit)
          .offset(offset);

        console.log(`[ORDERS] List fetched: ${results.length} items`);

        return {
          success: true,
          data: results,
          pagination: {
            page,
            limit,
            total: countResult?.count || 0,
            pages: Math.ceil((countResult?.count || 0) / limit),
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[ORDERS] List error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch orders',
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        status: t.Optional(t.String()),
        customerId: t.Optional(t.String()),
        deliveryType: t.Optional(t.String()),
        from: t.Optional(t.String({ format: 'date-time' })),
        to: t.Optional(t.String({ format: 'date-time' })),
      }),
    }
  )

  // ============================================
  // GET /orders/:id - ดูรายละเอียด Order
  // ============================================
  .get(
    '/:id',
    async ({ params }) => {
      try {
        // Get order with customer
        const orderWithCustomer = await db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            customerId: orders.customerId,
            customerName: users.fullName,
            customerEmail: users.email,
            customerPhone: users.phone,
            totalAmount: orders.totalAmount,
            subtotal: orders.subtotal,
            tax: orders.tax,
            discount: orders.discount,
            status: orders.status,
            deliveryType: orders.deliveryType,
            specialNotes: orders.specialNotes,
            receivedDate: orders.receivedDate,
            estimatedReadyDate: orders.estimatedReadyDate,
            completedDate: orders.completedDate,
            loyaltyPointsEarned: orders.loyaltyPointsEarned,
            createdAt: orders.createdAt,
            updatedAt: orders.updatedAt,
          })
          .from(orders)
          .innerJoin(users, eq(orders.customerId, users.id))
          .where(eq(orders.id, params.id));

        if (orderWithCustomer.length === 0) {
          return {
            success: false,
            error: 'Order not found',
            timestamp: new Date().toISOString(),
          };
        }

        const order = orderWithCustomer[0];

        // Get order items
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, params.id));

        // Get payment status
        const [payment] = await db
          .select()
          .from(payments)
          .where(eq(payments.orderId, params.id))
          .orderBy(desc(payments.createdAt))
          .limit(1);

        // Get tracking status (if assigned to driver)
        let driverInfo = null;
        if (orders.driverId) {
          const [driver] = await db
            .select()
            .from(users)
            .where(eq(users.id, orders.driverId));

          driverInfo = driver ? {
            id: driver.id,
            name: driver.fullName,
            phone: driver.phone,
          } : null;
        }

        // Get delivery assignment
        const [assignment] = await db
          .select()
          .from(deliveryAssignments)
          .where(eq(deliveryAssignments.orderId, params.id));

        console.log(`[ORDERS] Details fetched: ${params.id}`);

        return {
          success: true,
          data: {
            ...order,
            items,
            payment: payment ? {
              status: payment.status,
              method: payment.paymentMethod,
              amount: payment.amount,
              completedAt: payment.completedAt,
            } : null,
            driverInfo,
            deliveryTracking: assignment ? {
              status: assignment.status,
              priority: assignment.priority,
              estimatedPickupTime: assignment.estimatedPickupTime,
              estimatedDeliveryTime: assignment.estimatedDeliveryTime,
            } : null,
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[ORDERS] Get detail error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch order',
          timestamp: new Date().toISOString(),
        };
      }
    }
  )

  // ============================================
  // PATCH /orders/:id/status - อัปเดตสถานะงาน
  // ============================================
  .patch(
    '/:id/status',
    async ({ params, body }) => {
      try {
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, params.id));

        if (!order) {
          return {
            success: false,
            error: 'Order not found',
            timestamp: new Date().toISOString(),
          };
        }

        // Update order status
        const [updated] = await db
          .update(orders)
          .set({
            status: body.status,
            completedDate: body.status === 'COMPLETED' ? new Date() : order.completedDate,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, params.id))
          .returning();

        // Log workflow
        await db
          .insert(orderWorkflowHistory)
          .values({
            orderId: params.id,
            fromStatus: order.status,
            toStatus: body.status,
            reason: body.notes || `Status updated to ${body.status}`,
          });

        console.log(`[ORDERS] Status updated: ${params.id} -> ${body.status}`);

        return {
          success: true,
          data: {
            id: updated.id,
            orderNumber: updated.orderNumber,
            status: updated.status,
            previousStatus: order.status,
            updatedAt: updated.updatedAt,
          },
          message: `Order status updated to ${body.status}`,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[ORDERS] Update status error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update order status',
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      body: t.Object({
        status: t.Union([
          t.Literal('PENDING'),
          t.Literal('WASHING'),
          t.Literal('PACKING'),
          t.Literal('READY'),
          t.Literal('COMPLETED'),
          t.Literal('CANCELLED'),
        ]),
        notes: t.Optional(t.String()),
      }),
    }
  )

  // ============================================
  // GET /orders/customer/:lineId - LINE OA
  // ============================================
  .get(
    '/customer/:lineId',
    async ({ params }) => {
      try {
        // Find user by LINE ID
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.lineUserId, params.lineId));

        if (!user) {
          return {
            success: false,
            error: 'Customer not found',
            timestamp: new Date().toISOString(),
          };
        }

        // Get orders for this customer
        const customerOrders = await db
          .select()
          .from(orders)
          .where(eq(orders.customerId, user.id))
          .orderBy(desc(orders.receivedDate))
          .limit(10);

        console.log(`[ORDERS] LINE orders fetched: ${user.id} -> ${customerOrders.length} orders`);

        return {
          success: true,
          data: {
            customer: {
              id: user.id,
              name: user.fullName,
              phone: user.phone,
              loyaltyPoints: user.loyaltyPoints,
              membershipLevel: user.membershipLevel,
            },
            orders: customerOrders.map(order => ({
              id: order.id,
              orderNumber: order.orderNumber,
              totalAmount: order.totalAmount,
              status: order.status,
              deliveryType: order.deliveryType,
              receivedDate: order.receivedDate,
              estimatedReadyDate: order.estimatedReadyDate,
              completedDate: order.completedDate,
            })),
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[ORDERS] LINE orders error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch customer orders',
          timestamp: new Date().toISOString(),
        };
      }
    }
  );

export default orderRoutes;
