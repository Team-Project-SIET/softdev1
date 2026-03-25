import { db, orders, orderItems, orderWorkflowHistory, customers, users } from '../../../db';
import { eq, desc, and } from 'drizzle-orm';

/**
 * Orders Controller
 * Handles HTTP requests for order management
 */
export class OrdersController {
  constructor() {}

  /**
   * Create a new order
   * POST /orders
   */
  async createOrder(body: any, context: any) {
    try {
      const { customerId, orderType, pickupAddress, deliveryAddress, items, notes } = body;
      const user = context.user;

      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Unauthorized', data: null };
      }

      // Calculate total amount
      const totalAmount = items.reduce(
        (sum: number, item: any) => sum + item.quantity * item.unitPrice,
        0
      );

      // Generate order number: NJ-YYYYMMDD-XXX
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const seq = Math.floor(Math.random() * 900 + 100);
      const orderNumber = `NJ-${dateStr}-${seq}`;

      // Create order
      const [newOrder] = await db.insert(orders).values({
        orderNumber,
        customerId,
        createdBy: user.id,
        orderType: orderType || 'b2c',
        pickupAddress: pickupAddress || null,
        deliveryAddress: deliveryAddress || null,
        totalAmount: totalAmount.toString(),
        status: 'pending_pickup',
        paymentStatus: 'pending',
        notes: notes || null,
      }).returning();

      // Create order items
      if (items && items.length > 0) {
        await db.insert(orderItems).values(
          items.map((item: any) => ({
            orderId: newOrder.id,
            serviceId: item.serviceId,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            totalPrice: (item.quantity * item.unitPrice).toString(),
          }))
        );
      }

      // Create status history entry
      await db.insert(orderWorkflowHistory).values({
        orderId: newOrder.id,
        changedBy: user.id,
        toStatus: 'pending_pickup',
        notes: 'Order created',
      });

      context.set.status = 201;
      return {
        success: true,
        message: 'Order created successfully',
        data: newOrder,
      };
    } catch (error) {
      console.error('[OrdersController] Create error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create order',
        data: null,
      };
    }
  }

  /**
   * Get order by ID
   * GET /orders/:id
   */
  async getOrder(params: any, context: any) {
    try {
      const { id } = params;

      // Get order
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);

      if (!order) {
        context.set.status = 404;
        return { success: false, message: 'Order not found', data: null };
      }

      // Get order items with service details
      const items = await db
        .select({
          id: orderItems.id,
          serviceId: orderItems.serviceId,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          totalPrice: orderItems.totalPrice,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, id));

      // Get customer info
      const [customer] = await db
        .select({
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
          address: customers.address,
        })
        .from(customers)
        .where(eq(customers.id, order.customerId))
        .limit(1);

      return {
        success: true,
        message: 'Order retrieved successfully',
        data: {
          ...order,
          items,
          customer,
        },
      };
    } catch (error) {
      console.error('[OrdersController] Get error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get order',
        data: null,
      };
    }
  }

  /**
   * List all orders
   * GET /orders
   */
  async listOrders(query: any, context: any) {
    try {
      const { status, customerId, limit = 50, page = 1 } = query;
      const offset = (page - 1) * limit;

      // Build conditions
      const conditions: any[] = [];
      if (status) conditions.push(eq(orders.status, status));
      if (customerId) conditions.push(eq(orders.customerId, customerId));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get orders
      const orderList = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerId: orders.customerId,
          status: orders.status,
          orderType: orders.orderType,
          totalAmount: orders.totalAmount,
          paymentStatus: orders.paymentStatus,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(parseInt(limit))
        .offset(offset);

      // Get total count
      const countResult = await db
        .select({ count: orders.id })
        .from(orders)
        .where(whereClause);

      const total = countResult.length;

      return {
        success: true,
        message: 'Orders retrieved successfully',
        data: {
          orders: orderList,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        },
      };
    } catch (error) {
      console.error('[OrdersController] List error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to list orders',
        data: null,
      };
    }
  }

  /**
   * Update an order
   * PATCH /orders/:id
   */
  async updateOrder(params: any, body: any, context: any) {
    try {
      const { id } = params;
      const { pickupAddress, deliveryAddress, notes } = body;
      const user = context.user;

      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Unauthorized', data: null };
      }

      // Check if order exists
      const [existingOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);

      if (!existingOrder) {
        context.set.status = 404;
        return { success: false, message: 'Order not found', data: null };
      }

      // Update order
      const [updatedOrder] = await db
        .update(orders)
        .set({
          pickupAddress: pickupAddress !== undefined ? pickupAddress : existingOrder.pickupAddress,
          deliveryAddress: deliveryAddress !== undefined ? deliveryAddress : existingOrder.deliveryAddress,
          notes: notes !== undefined ? notes : existingOrder.notes,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      return {
        success: true,
        message: 'Order updated successfully',
        data: updatedOrder,
      };
    } catch (error) {
      console.error('[OrdersController] Update error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update order',
        data: null,
      };
    }
  }

  /**
   * Delete an order (soft delete by cancelling)
   * DELETE /orders/:id
   */
  async deleteOrder(params: any, context: any) {
    try {
      const { id } = params;
      const user = context.user;

      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Unauthorized', data: null };
      }

      // Check if order exists
      const [existingOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);

      if (!existingOrder) {
        context.set.status = 404;
        return { success: false, message: 'Order not found', data: null };
      }

      // Cancel the order instead of hard delete
      await db
        .update(orders)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(orders.id, id));

      // Add status history entry
      await db.insert(orderWorkflowHistory).values({
        orderId: id,
        changedBy: user.id,
        toStatus: 'cancelled',
        fromStatus: existingOrder.status,
        reason: 'Order cancelled',
      });

      return {
        success: true,
        message: 'Order cancelled successfully',
        data: null,
      };
    } catch (error) {
      console.error('[OrdersController] Delete error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel order',
        data: null,
      };
    }
  }

  /**
   * Transition order status
   * POST /orders/:id/status
   */
  async transitionOrder(params: any, body: any, context: any) {
    try {
      const { id } = params;
      const { status, note } = body;
      const user = context.user;

      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Unauthorized', data: null };
      }

      // Check if order exists
      const [existingOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);

      if (!existingOrder) {
        context.set.status = 404;
        return { success: false, message: 'Order not found', data: null };
      }

      // Valid status transitions according to SRS v2.4
      const validTransitions: Record<string, string[]> = {
        'pending_pickup': ['washing', 'cancelled'],
        'washing': ['packing'],
        'packing': ['ready_for_delivery'],
        'ready_for_delivery': ['completed'],
        'completed': [],
        'cancelled': [],
        'PENDING': ['WASHING', 'CANCELLED'],
        'WASHING': ['PACKING'],
        'PACKING': ['READY'],
        'READY': ['COMPLETED'],
        'COMPLETED': [],
        'CANCELLED': [],
      };

      const currentStatus = existingOrder.status;
      if (!validTransitions[currentStatus]?.includes(status)) {
        context.set.status = 400;
        return {
          success: false,
          message: `Cannot transition from ${currentStatus} to ${status}`,
          data: null,
        };
      }

      // Update order status
      const [updatedOrder] = await db
        .update(orders)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      // Create status history entry
      await db.insert(orderWorkflowHistory).values({
        orderId: id,
        changedBy: user.id,
        toStatus: status,
        fromStatus: currentStatus,
        reason: note || `Status changed from ${currentStatus} to ${status}`,
      });

      return {
        success: true,
        message: `Order status updated to ${status}`,
        data: updatedOrder,
      };
    } catch (error) {
      console.error('[OrdersController] Transition error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update order status',
        data: null,
      };
    }
  }

  /**
   * Get order workflow history
   * GET /orders/:id/history
   */
  async getWorkflowHistory(params: any, context: any) {
    try {
      const { id } = params;

      // Check if order exists
      const [existingOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);

      if (!existingOrder) {
        context.set.status = 404;
        return { success: false, message: 'Order not found', data: null };
      }

      // Get status history with user info
      const history = await db
        .select({
          id: orderWorkflowHistory.id,
          toStatus: orderWorkflowHistory.toStatus,
          fromStatus: orderWorkflowHistory.fromStatus,
          notes: orderWorkflowHistory.notes,
          reason: orderWorkflowHistory.reason,
          transitionedAt: orderWorkflowHistory.transitionedAt,
          changedBy: users.fullName,
        })
        .from(orderWorkflowHistory)
        .leftJoin(users, eq(orderWorkflowHistory.changedBy, users.id))
        .where(eq(orderWorkflowHistory.orderId, id))
        .orderBy(desc(orderWorkflowHistory.transitionedAt));

      return {
        success: true,
        message: 'Order history retrieved successfully',
        data: history,
      };
    } catch (error) {
      console.error('[OrdersController] History error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get order history',
        data: null,
      };
    }
  }
}
