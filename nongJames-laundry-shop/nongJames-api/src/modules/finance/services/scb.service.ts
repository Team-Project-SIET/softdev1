// SCB (Siam Commercial Bank) API integration
export class ScbService {
  constructor() {}

  async initiatePayment(orderId: string, amount: number, returnUrl: string): Promise<any> {
    // TODO: Create payment request to SCB API
    // Returns payment URL or QR code
    return {
      paymentUrl: 'https://scb.example.com/pay/xxx',
      qrCode: 'data:image/png;base64,...',
      transactionRef: 'SCB-' + Date.now(),
    };
  }

  async verifyPayment(transactionRef: string): Promise<any> {
    // TODO: Query SCB API to verify payment status
    return {
      transactionRef,
      status: 'COMPLETED',
      amount: 0,
    };
  }

  async handlePaymentCallback(transactionRef: string, status: string): Promise<void> {
    // TODO: Handle webhook from SCB
  }
}
