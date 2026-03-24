import { db } from '@/db';
import { deliveryAssignments, drivers, orders, users, driverLocationHistory } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Assignment Service
 * Handles driver assignment to orders and delivery workflow
 */
export class AssignmentService {
  /**
   * Assign order to driver
   */
  async assignOrderToDriver(
    orderId: string,
    driverId: string,
    assignmentType: 'PICKUP' | 'DELIVERY' | 'BOTH' = 'DELIVERY',
    priority?: number
  ): Promise<any> {
    try {
      // Verify order exists
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new Error('Order not found');
      }

      // Verify driver exists and is available
      const [driver] = await db
        .select()
        .from(drivers)
        .where(eq(drivers.id, driverId))
        .limit(1);

      if (!driver) {
        throw new Error('Driver not found');
      }

      if (!driver.isActive || !driver.isAvailable) {
        throw new Error('Driver is not available');
      }

      // Create assignment
      const [assignment] = await db
        .insert(deliveryAssignments)
        .values({
          id: `assign_${Date.now()}`,
          orderId,
          driverId,
          assignmentType,
          status: 'ASSIGNED',
          priority: priority || 1,
          estimatedPickupTime: assignmentType === 'PICKUP' || assignmentType === 'BOTH'
            ? new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
            : null,
          estimatedDeliveryTime: assignmentType === 'DELIVERY' || assignmentType === 'BOTH'
            ? new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
            : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Update order with driver
      await db
        .update(orders)
        .set({ driverId, updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      console.log(`[LOGISTICS] Assignment created: ${assignmentType} Order ${orderId} to Driver ${driverId}`);
      return assignment;
    } catch (error) {
      console.error('[LOGISTICS] Assignment error:', error);
      throw error;
    }
  }

  /**
   * Get driver assignments
   */
  async getDriverAssignments(
    driverId: string,
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ assignments: any[]; total: number; pages: number }> {
    try {
      const offset = (page - 1) * limit;

      const conditions: any[] = [eq(deliveryAssignments.driverId, driverId)];
      if (status) conditions.push(eq(deliveryAssignments.status, status as any));

      const query = and(...conditions);

      // Get total
      const allAssignments = await db
        .select()
        .from(deliveryAssignments)
        .where(query);

      const total = allAssignments.length;

      // Get paginated
      const assignments = await db
        .select({
          id: deliveryAssignments.id,
          orderId: deliveryAssignments.orderId,
          assignmentType: deliveryAssignments.assignmentType,
          status: deliveryAssignments.status,
          priority: deliveryAssignments.priority,
          estimatedPickupTime: deliveryAssignments.estimatedPickupTime,
          estimatedDeliveryTime: deliveryAssignments.estimatedDeliveryTime,
          actualPickupTime: deliveryAssignments.actualPickupTime,
          actualDeliveryTime: deliveryAssignments.actualDeliveryTime,
          orderNumber: orders.orderNumber,
          pickupAddress: deliveryAssignments.pickupAddress,
          totalAmount: orders.totalAmount,
        })
        .from(deliveryAssignments)
        .innerJoin(orders, eq(deliveryAssignments.orderId, orders.id))
        .where(query)
        .orderBy(desc(deliveryAssignments.priority), deliveryAssignments.estimatedPickupTime)
        .limit(limit)
        .offset(offset);

      return {
        assignments,
        total,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('[LOGISTICS] Get assignments error:', error);
      throw error;
    }
  }

  /**
   * Update assignment status
   */
  async updateAssignmentStatus(
    assignmentId: string,
    newStatus: string,
    latitude?: number,
    longitude?: number
  ): Promise<any> {
    try {
      const [assignment] = await db
        .select()
        .from(deliveryAssignments)
        .where(eq(deliveryAssignments.id, assignmentId))
        .limit(1);

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      // Validate status transition
      const validTransitions: { [key: string]: string[] } = {
        'ASSIGNED': ['PICKED_UP', 'CANCELLED'],
        'PICKED_UP': ['DELIVERED', 'FAILED'],
        'DELIVERED': [],
        'FAILED': ['ASSIGNED'],
        'CANCELLED': [],
      };

      if (!validTransitions[assignment.status]?.includes(newStatus)) {
        throw new Error(`Invalid status transition from ${assignment.status} to ${newStatus}`);
      }

      // Update assignment
      const [updated] = await db
        .update(deliveryAssignments)
        .set({
          status: newStatus as any,
          actualPickupTime: newStatus === 'PICKED_UP' ? new Date() : assignment.actualPickupTime,
          actualDeliveryTime: newStatus === 'ARRIVED_DELIVERY' ? new Date() : assignment.actualDeliveryTime,
        })
        .where(eq(deliveryAssignments.id, assignmentId))
        .returning();

      // Record location
      if (latitude !== undefined && longitude !== undefined) {
        await db.insert(driverLocationHistory).values({
          driverId: assignment.driverId,
          assignmentId,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        });
      }

      // If delivered, mark order as completed
      if (newStatus === 'DELIVERED') {
        await db
          .update(orders)
          .set({ status: 'COMPLETED', completedDate: new Date(), updatedAt: new Date() })
          .where(eq(orders.id, assignment.orderId));
      }

      console.log(`[LOGISTICS] Assignment status updated: ${assignmentId} -> ${newStatus}`);
      return updated;
    } catch (error) {
      console.error('[LOGISTICS] Status update error:', error);
      throw error;
    }
  }

  /**
   * Reassign order to different driver
   */
  async reassignOrder(
    assignmentId: string,
    newDriverId: string,
    reason?: string
  ): Promise<any> {
    try {
      const [assignment] = await db
        .select()
        .from(deliveryAssignments)
        .where(eq(deliveryAssignments.id, assignmentId))
        .limit(1);

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      // Verify new driver is available
      const [newDriver] = await db
        .select()
        .from(drivers)
        .where(eq(drivers.id, newDriverId))
        .limit(1);

      if (!newDriver || !newDriver.isAvailable) {
        throw new Error('New driver is not available');
      }

      // Update assignment
      const [updated] = await db
        .update(deliveryAssignments)
        .set({
          driverId: newDriverId,
          updatedAt: new Date(),
        })
        .where(eq(deliveryAssignments.id, assignmentId))
        .returning();

      // Update order
      await db
        .update(orders)
        .set({ driverId: newDriverId, updatedAt: new Date() })
        .where(eq(orders.id, assignment.orderId));

      console.log(`[LOGISTICS] Reassigned: ${assignment.orderId} from ${assignment.driverId} to ${newDriverId}. Reason: ${reason}`);
      return updated;
    } catch (error) {
      console.error('[LOGISTICS] Reassign error:', error);
      throw error;
    }
  }

  /**
   * Complete assignment
   */
  async completeAssignment(assignmentId: string): Promise<void> {
    try {
      await db
        .update(deliveryAssignments)
        .set({ status: 'COMPLETED', updatedAt: new Date() })
        .where(eq(deliveryAssignments.id, assignmentId));

      console.log(`[LOGISTICS] Assignment completed: ${assignmentId}`);
    } catch (error) {
      console.error('[LOGISTICS] Complete assignment error:', error);
      throw error;
    }
  }
}
