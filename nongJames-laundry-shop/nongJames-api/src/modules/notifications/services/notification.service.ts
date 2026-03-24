// Unified notification service
export class NotificationService {
  constructor() {}

  async notifyOrderCreated(customerId: string, orderId: string): Promise<void> {
    // TODO: Send via LINE, Email, SMS
  }

  async notifyOrderStatusChange(customerId: string, orderId: string, newStatus: string): Promise<void> {
    // TODO: Notify user of order status change
  }

  async notifyPaymentRequired(customerId: string, orderId: string, amount: number): Promise<void> {
    // TODO: Send payment reminder
  }

  async notifyDeliveryStarted(customerId: string, orderId: string, driverId: string): Promise<void> {
    // TODO: Notify delivery is on the way
  }

  async notifyDeliveryCompleted(customerId: string, orderId: string): Promise<void> {
    // TODO: Send delivery confirmation
  }
}
