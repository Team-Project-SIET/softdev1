import { LineClient } from '../../../integrations/line/line.client';
import { db, customers, orders } from '../../../db';
import { eq } from 'drizzle-orm';

/**
 * Notifications Controller
 * Handles sending notifications via LINE, Email, etc.
 */
export class NotificationsController {
  private lineClient: LineClient;

  constructor() {
    this.lineClient = new LineClient();
  }

  /**
   * Send notification to customer
   * POST /notifications/send
   */
  async sendNotification(body: any, context: any) {
    try {
      const { customerId, orderId, type, message } = body;
      const user = context.user;

      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Unauthorized', data: null };
      }

      // Get customer details
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      if (!customer) {
        return { success: false, message: 'Customer not found', data: null };
      }

      // Get order details if orderId provided
      let order = null;
      if (orderId) {
        const [orderData] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, orderId))
          .limit(1);
        order = orderData;
      }

      // Send via LINE (if we have userId)
      let lineResult = null;
      if (customer.userId) {
        try {
          const lineMessage = message || this.getDefaultMessage(type, order);
          lineResult = await this.lineClient.sendMessage(customer.userId, lineMessage);
        } catch (err) {
          console.error('[Notifications] LINE send failed:', err);
        }
      }

      return {
        success: true,
        message: 'Notification sent',
        data: {
          customerId,
          orderId,
          type,
          lineSent: !!lineResult?.success,
        },
      };
    } catch (error) {
      console.error('[NotificationsController] Send error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send notification',
        data: null,
      };
    }
  }

  /**
   * Send order status notification
   * POST /notifications/order-status
   */
  async sendOrderStatusNotification(body: any, context: any) {
    try {
      const { orderId, status } = body;
      const user = context.user;

      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Unauthorized', data: null };
      }

      // Get order with customer
      const [order] = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerId: orders.customerId,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        return { success: false, message: 'Order not found', data: null };
      }

      // Get customer
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, order.customerId))
        .limit(1);

      if (!customer?.userId) {
        return {
          success: false,
          message: 'Customer not linked to LINE',
          data: null,
        };
      }

      // Send status notification
      const result = await this.lineClient.notifyOrderStatus(
        customer.userId,
        order.orderNumber,
        status
      );

      return {
        success: result.success,
        message: result.success ? 'Status notification sent' : 'Failed to send notification',
        data: { orderId, status },
      };
    } catch (error) {
      console.error('[NotificationsController] Order status error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send status notification',
        data: null,
      };
    }
  }

  /**
   * Broadcast message to all customers
   * POST /notifications/broadcast
   */
  async broadcastMessage(body: any, context: any) {
    try {
      const { message, customerType } = body;
      const user = context.user;

      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Unauthorized', data: null };
      }

      // Only admin can broadcast
      if (user.role !== 'ADMIN') {
        context.set.status = 403;
        return { success: false, message: 'Only admin can broadcast', data: null };
      }

      // This is a placeholder - in production you'd get all customers with LINE IDs
      // and send messages in batches
      console.log('[Notifications] Broadcast message:', message);

      return {
        success: true,
        message: 'Broadcast queued',
        data: {
          message,
          targetCustomerType: customerType || 'ALL',
          estimatedRecipients: 0,
        },
      };
    } catch (error) {
      console.error('[NotificationsController] Broadcast error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to broadcast',
        data: null,
      };
    }
  }

  /**
   * Get default message templates
   */
  private getDefaultMessage(type: string, order: any): string {
    const templates: Record<string, string> = {
      ORDER_CREATED: order
        ? `Your order #${order.orderNumber} has been received. We'll start processing soon.`
        : 'Your order has been received.',
      ORDER_COMPLETED: order
        ? `Your order #${order.orderNumber} is complete. Thank you for choosing us!`
        : 'Your order is complete.',
      PAYMENT_RECEIVED: 'Payment received. Thank you!',
      DELIVERY_STARTED: 'Your order is on the way!',
      DELIVERY_COMPLETED: 'Your order has been delivered.',
    };

    return templates[type] || 'Notification from NongJames Laundry';
  }
}
