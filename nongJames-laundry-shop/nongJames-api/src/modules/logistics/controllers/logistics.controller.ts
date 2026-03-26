import { db, driverTasks, orders, users, customers } from '../../../db';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Logistics Controller
 * Handles HTTP requests for driver task management
 */
export class LogisticsController {
  constructor() {}

  /**
   * Create a driver (staff with driver role)
   * POST /logistics/drivers
   */
  async createDriver(body: any) {
    try {
      const { name, email, phone } = body;

      // Create user with driver role
      const [newUser] = await db.insert(users).values({
        fullName: name,
        email,
        phone,
        role: 'DRIVER',
      }).returning();

      return {
        success: true,
        message: 'Driver created successfully',
        data: newUser,
      };
    } catch (error) {
      console.error('[LogisticsController] Create driver error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create driver',
        data: null,
      };
    }
  }

  /**
   * Get driver by ID
   * GET /logistics/drivers/:driverId
   */
  async getDriver(params: any) {
    try {
      const { driverId } = params;

      const [driver] = await db
        .select({
          id: users.id,
          name: users.fullName,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(and(eq(users.id, driverId), eq(users.role, 'DRIVER')))
        .limit(1);

      if (!driver) {
        return { success: false, message: 'Driver not found', data: null };
      }

      // Get task statistics
      const taskStats = await db
        .select({
          id: driverTasks.id,
        })
        .from(driverTasks)
        .where(eq(driverTasks.driverId, driverId));

      return {
        success: true,
        message: 'Driver retrieved successfully',
        data: {
          ...driver,
          stats: {
            totalTasks: taskStats.length,
          },
        },
      };
    } catch (error) {
      console.error('[LogisticsController] Get driver error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get driver',
        data: null,
      };
    }
  }

  /**
   * List all drivers
   * GET /logistics/drivers
   */
  async listDrivers(query: any) {
    try {
      const { limit = 50, page = 1 } = query;
      const offset = (page - 1) * limit;

      const driverList = await db
        .select({
          id: users.id,
          name: users.fullName,
          email: users.email,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.role, 'DRIVER'))
        .orderBy(desc(users.createdAt))
        .limit(parseInt(limit))
        .offset(offset);

      return {
        success: true,
        message: 'Drivers retrieved successfully',
        data: {
          drivers: driverList,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
          },
        },
      };
    } catch (error) {
      console.error('[LogisticsController] List drivers error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to list drivers',
        data: null,
      };
    }
  }

  /**
   * Assign order to driver
   * POST /logistics/assignments
   */
  async assignOrder(body: any) {
    try {
      const { orderId, driverId, taskType, notes } = body;

      // Verify order exists
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        return { success: false, message: 'Order not found', data: null };
      }

      // Verify driver exists and has driver role
      const [driver] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, driverId), eq(users.role, 'DRIVER')))
        .limit(1);

      if (!driver) {
        return { success: false, message: 'Driver not found', data: null };
      }

      // Create driver task
      const [assignment] = await db.insert(driverTasks).values({
        orderId,
        driverId,
        taskType,
        status: 'assigned',
        notes: notes || null,
      }).returning();

      return {
        success: true,
        message: 'Order assigned to driver successfully',
        data: assignment,
      };
    } catch (error) {
      console.error('[LogisticsController] Assign order error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to assign order',
        data: null,
      };
    }
  }

  /**
   * Get driver's assignments
   * GET /logistics/drivers/:driverId/assignments
   */
  async getAssignments(params: any) {
    try {
      const { driverId } = params;

      const assignments = await db
        .select({
          id: driverTasks.id,
          taskType: driverTasks.taskType,
          status: driverTasks.status,
          assignedAt: driverTasks.assignedAt,
          completedAt: driverTasks.completedAt,
          notes: driverTasks.notes,
          orderId: orders.id,
          orderNumber: orders.orderNumber,
          orderStatus: orders.status,
          pickupAddress: orders.pickupAddress,
          deliveryAddress: orders.deliveryAddress,
          customerName: customers.name,
          customerPhone: customers.phone,
        })
        .from(driverTasks)
        .innerJoin(orders, eq(driverTasks.orderId, orders.id))
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .where(eq(driverTasks.driverId, driverId))
        .orderBy(desc(driverTasks.assignedAt));

      return {
        success: true,
        message: 'Assignments retrieved successfully',
        data: assignments,
      };
    } catch (error) {
      console.error('[LogisticsController] Get assignments error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get assignments',
        data: null,
      };
    }
  }

  /**
   * Get delivery status for an order
   * GET /logistics/orders/:orderId/status
   */
  async getDeliveryStatus(params: any) {
    try {
      const { orderId } = params;

      const [assignment] = await db
        .select({
          id: driverTasks.id,
          taskType: driverTasks.taskType,
          status: driverTasks.status,
          assignedAt: driverTasks.assignedAt,
          completedAt: driverTasks.completedAt,
          driverId: users.id,
          driverName: users.fullName,
          orderNumber: orders.orderNumber,
          orderStatus: orders.status,
        })
        .from(driverTasks)
        .innerJoin(orders, eq(driverTasks.orderId, orders.id))
        .innerJoin(users, eq(driverTasks.driverId, users.id))
        .where(eq(driverTasks.orderId, orderId))
        .limit(1);

      if (!assignment) {
        return { success: false, message: 'No delivery assignment found', data: null };
      }

      return {
        success: true,
        message: 'Delivery status retrieved successfully',
        data: assignment,
      };
    } catch (error) {
      console.error('[LogisticsController] Get delivery status error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get delivery status',
        data: null,
      };
    }
  }

  /**
   * Update driver location (placeholder - would need location tracking table)
   * POST /logistics/drivers/:driverId/location
   */
  async updateLocation(body: any, user: any) {
    try {
      const { latitude, longitude } = body;

      if (!user) {
        return { success: false, message: 'Unauthorized', data: null };
      }

      // Note: This would require a driver_locations table
      // For now, just return success
      return {
        success: true,
        message: 'Location updated',
        data: { driverId: user.id, latitude, longitude, timestamp: new Date() },
      };
    } catch (error) {
      console.error('[LogisticsController] Update location error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update location',
        data: null,
      };
    }
  }

  /**
   * Update task status (for drivers)
   * PATCH /logistics/tasks/:id/status
   */
  async updateTaskStatus(params: any, body: any, user: any) {
    try {
      const { id } = params;
      const { status } = body;

      if (!user) {
        return { success: false, message: 'Unauthorized', data: null, status: 401 };
      }

      // Verify task exists and belongs to this driver
      const [task] = await db
        .select()
        .from(driverTasks)
        .where(eq(driverTasks.id, id))
        .limit(1);

      if (!task) {
        return { success: false, message: 'Task not found', data: null, status: 404 };
      }

      // Only allow the assigned driver or admin to update
      if (task.driverId !== user.id && user.role !== 'ADMIN') {
        return { success: false, message: 'Not authorized to update this task', data: null, status: 403 };
      }

      // Update task status
      const [updatedTask] = await db
        .update(driverTasks)
        .set({
          status,
          completedAt: status === 'completed' ? new Date() : task.completedAt,
        })
        .where(eq(driverTasks.id, id))
        .returning();

      // If task is completed, update order status accordingly
      if (status === 'completed') {
        const newOrderStatus = task.taskType === 'pickup' ? 'washing' : 'completed';
        await db
          .update(orders)
          .set({ status: newOrderStatus, updatedAt: new Date() })
          .where(eq(orders.id, task.orderId));
      }

      return {
        success: true,
        message: `Task status updated to ${status}`,
        data: updatedTask,
      };
    } catch (error) {
      console.error('[LogisticsController] Update task status error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update task status',
        data: null,
      };
    }
  }
}
