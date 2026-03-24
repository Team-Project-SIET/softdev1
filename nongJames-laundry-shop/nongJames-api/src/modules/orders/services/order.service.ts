import { db } from '@/db';
import { orders, orderItems, users, payments, deliveryAssignments } from '@/db/schema';
import { eq, and, desc, gte, lte, or } from 'drizzle-orm';

/**
 * Order Service
 * Business logic for order management, status transitions, and calculations
 */
export class OrderService {
  /**
   * Generate unique order number
   */
  private generateOrderNumber(): string {
    const prefix = 'ORD';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Create new order with items
   */
  async createOrder(customerId: string, data: {
    items: Array<{ serviceId: string; quantity: number; unitPrice: number }>;
    deliveryType: 'PICKUP' | 'DELIVERY';
    deliveryAddress?: string;
    notes?: string;
  }): Promise<any> {
    try {
      const orderNumber = this.generateOrderNumber();
      
      // Calculate totals
      let subtotal = 0;
      for (const item of data.items) {
        subtotal += item.quantity * item.unitPrice;
      }
      
      const tax = subtotal * 0.07; // 7% VAT
      const deliveryFee = data.deliveryType === 'DELIVERY' ? 50 : 0;
      const totalAmount = subtotal + tax + deliveryFee;
      const loyaltyPoints = Math.floor(totalAmount / 100);

      // Create order
      const [order] = await db
        .insert(orders)
        .values({
          orderNumber,
          customerId,
          status: 'PENDING',
          deliveryType: data.deliveryType,
          subtotal: subtotal.toString(),
          tax: tax.toString(),
          totalAmount: totalAmount.toString(),
          loyaltyPointsEarned: loyaltyPoints,
          receivedDate: new Date(),
          estimatedReadyDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          specialNotes: data.notes || '',
        })
        .returning();

      // Create order items
      for (const item of data.items) {
        await db.insert(orderItems).values({
          orderId: order.id,
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: (item.quantity * item.unitPrice).toString(),
        });
      }

      console.log(`[ORDER] Created: ${orderNumber} for customer ${customerId}`);
      return order;
    } catch (error) {
      console.error('[ORDER] Creation error:', error);
      throw error;
    }
  }

  /**
   * Get order by ID with full details
   */
  async getOrderById(orderId: string): Promise<any> {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new Error('Order not found');
      }

      // Get order items
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      // Get customer info
      const [customer] = await db
        .select()
        .from(users)
        .where(eq(users.id, order.customerId))
        .limit(1);

      // Get payment info
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1);

      // Get driver assignment
      const [assignment] = await db
        .select()
        .from(deliveryAssignments)
        .where(eq(deliveryAssignments.orderId, orderId))
        .limit(1);

      return {
        ...order,
        items,
        customer,
        payment,
        assignment,
      };
    } catch (error) {
      console.error('[ORDER] Get by ID error:', error);
      throw error;
    }
  }

  /**
   * List orders with filtering and pagination
   */
  async listOrders(
    customerId?: string,
    status?: string,
    dateFrom?: Date,
    dateTo?: Date,
    page: number = 1,
    limit: number = 10
  ): Promise<{ orders: any[]; total: number; pages: number }> {
    try {
      const offset = (page - 1) * limit;

      const conditions: any[] = [];
      if (customerId) conditions.push(eq(orders.customerId, customerId));
      if (status) conditions.push(eq(orders.status, status as any));
      if (dateFrom) conditions.push(gte(orders.createdAt, dateFrom));
      if (dateTo) conditions.push(lte(orders.createdAt, dateTo));

      const query = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countResult = await db
        .select({ count: orders.id })
        .from(orders)
        .where(query);

      const total = countResult.length;

      // Get paginated orders
      const orderList = await db
        .select()
        .from(orders)
        .where(query)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        orders: orderList,
        total,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('[ORDER] List error:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, newStatus: string): Promise<any> {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new Error('Order not found');
      }

      // Validate status transition
      const validTransitions: { [key: string]: string[] } = {
        'PENDING': ['WASHING', 'CANCELLED'],
        'WASHING': ['PACKING'],
        'PACKING': ['READY'],
        'READY': ['COMPLETED', 'CANCELLED'],
        'COMPLETED': [],
        'CANCELLED': [],
      };

      if (!validTransitions[order.status]?.includes(newStatus)) {
        throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
      }

      // Update order
      const [updated] = await db
        .update(orders)
        .set({
          status: newStatus as any,
          completedDate: newStatus === 'COMPLETED' ? new Date() : undefined,
        })
        .where(eq(orders.id, orderId))
        .returning();

      console.log(`[ORDER] Status updated: ${orderId} -> ${newStatus}`);
      return updated;
    } catch (error) {
      console.error('[ORDER] Status update error:', error);
      throw error;
    }
  }

  /**
   * Delete order (soft delete by marking as CANCELLED)
   */
  async deleteOrder(orderId: string): Promise<void> {
    try {
      // Mark as CANCELLED instead of DELETED (DELETED is not a valid status)
      await db
        .update(orders)
        .set({ status: 'CANCELLED' as any })
        .where(eq(orders.id, orderId));

      console.log(`[ORDER] Deleted: ${orderId}`);
    } catch (error) {
      console.error('[ORDER] Delete error:', error);
      throw error;
    }
  }

  /**
   * Get order by LINE user ID (for B2C queries)
   */
  async getOrdersByLineUserId(lineUserId: string, page: number = 1, limit: number = 10): Promise<any> {
    try {
      const offset = (page - 1) * limit;

      // Find user by LINE ID
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.lineUserId, lineUserId))
        .limit(1);

      if (!user) {
        return { orders: [], total: 0, pages: 0 };
      }

      // Get user's orders
      const orderList = await db
        .select()
        .from(orders)
        .where(eq(orders.customerId, user.id))
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset);

      const total = orderList.length;

      return {
        orders: orderList,
        total,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('[ORDER] Get by LINE ID error:', error);
      throw error;
    }
  }
}
