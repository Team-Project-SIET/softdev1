// Email notifications
export class EmailService {
  constructor() {}

  async sendOrderConfirmation(email: string, orderId: string, totalAmount: number): Promise<void> {
    // TODO: Send order confirmation email
  }

  async sendPaymentReceipt(email: string, paymentId: string, amount: number): Promise<void> {
    // TODO: Send payment receipt
  }

  async sendDeliveryNotification(email: string, orderId: string, estimatedTime: Date): Promise<void> {
    // TODO: Send delivery notification
  }

  async sendInvoice(email: string, invoiceId: string, pdfUrl: string): Promise<void> {
    // TODO: Send invoice PDF
  }
}
