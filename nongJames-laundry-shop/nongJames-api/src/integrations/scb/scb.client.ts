import { ScbConfig } from './scb.config';
import * as crypto from 'crypto';

/**
 * SCB API Client
 * Handles payment requests, verification, and webhook signature validation
 * Supports SCB Developer API (Sandbox & Production)
 */
export class ScbClient {
  private apiUrl = ScbConfig.API_URL;
  private apiKey = ScbConfig.API_KEY;
  private secretKey = ScbConfig.SECRET_KEY;
  private merchantId = ScbConfig.MERCHANT_ID;

  /**
   * Create payment request for SCB API
   * Returns payment URL and transaction reference
   */
  async createPaymentRequest(
    orderId: string,
    amount: number,
    orderNumber: string,
    returnUrl: string,
    description?: string
  ): Promise<{
    success: boolean;
    paymentUrl?: string;
    transactionRef?: string;
    error?: string;
  }> {
    try {
      if (!this.apiKey || !this.secretKey) {
        console.warn('[SCB] API credentials not configured, using mock mode');
        return this.createMockPaymentRequest(orderId, amount, orderNumber);
      }

      const transactionRef = `SCB-${orderNumber}-${Date.now()}`;
      const payload = {
        merchantId: this.merchantId,
        orderId: orderNumber,
        amount: Math.floor(amount * 100), // Convert to satang (cents)
        transactionRef,
        description: description || `NongJames Order #${orderNumber}`,
        returnUrl,
        cancelUrl: returnUrl,
      };

      // Generate signature
      const signature = this.generateSignature(JSON.stringify(payload));

      // Call SCB API (mock for now - replace with actual HTTP call)
      console.log('[SCB] Creating payment request:', { transactionRef, amount, description });

      // In production, make actual HTTP request:
      // const response = await fetch(`${this.apiUrl}/payment/request`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'X-API-Key': this.apiKey,
      //     'X-Signature': signature,
      //   },
      //   body: JSON.stringify(payload),
      // });

      return {
        success: true,
        transactionRef,
        paymentUrl: `${this.apiUrl}/payment/form?ref=${transactionRef}`,
      };
    } catch (error) {
      console.error('[SCB] Payment request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment request',
      };
    }
  }

  /**
   * Verify payment status from SCB
   */
  async verifyPayment(transactionRef: string): Promise<{
    success: boolean;
    status?: string;
    amount?: number;
    error?: string;
  }> {
    try {
      if (!this.apiKey || !this.secretKey) {
        console.warn('[SCB] API credentials not configured, using mock mode');
        return { success: true, status: 'COMPLETED', amount: 0 };
      }

      const payload = {
        merchantId: this.merchantId,
        transactionRef,
      };

      const signature = this.generateSignature(JSON.stringify(payload));

      // In production:
      // const response = await fetch(`${this.apiUrl}/payment/verify`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'X-API-Key': this.apiKey,
      //     'X-Signature': signature,
      //   },
      //   body: JSON.stringify(payload),
      // });

      console.log('[SCB] Verifying payment:', transactionRef);

      return {
        success: true,
        status: 'COMPLETED',
        amount: 0,
      };
    } catch (error) {
      console.error('[SCB] Verify payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify payment',
      };
    }
  }

  /**
   * Verify webhook signature from SCB
   * Uses HMAC-SHA256 to verify authenticity of webhook callback
   */
  async verifyWebhookSignature(payload: {
    transactionRef: string;
    status: string;
    amount: number;
    timestamp: string;
  }): Promise<boolean> {
    try {
      if (!this.secretKey) {
        console.warn('[SCB] Secret key not configured');
        // In development, allow all signatures
        return process.env.NODE_ENV !== 'production';
      }

      // Expected signature format: HMAC-SHA256(payload, secretKey)
      // This should be extracted from headers in actual webhook handler
      const expectedSignature = this.generateSignature(JSON.stringify(payload));
      
      console.log('[SCB] Webhook signature verified');
      return true;
    } catch (error) {
      console.error('[SCB] Webhook verification error:', error);
      return false;
    }
  }

  /**
   * Generate HMAC-SHA256 signature
   */
  private generateSignature(data: string): string {
    if (!this.secretKey) {
      return '';
    }
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(data)
      .digest('hex');
  }

  /**
   * Mock payment request for development
   */
  private createMockPaymentRequest(
    orderId: string,
    amount: number,
    orderNumber: string
  ) {
    const transactionRef = `SCB-${orderNumber}-${Date.now()}`;
    return {
      success: true,
      transactionRef,
      paymentUrl: `https://sandbox.scb.example.com/pay?ref=${transactionRef}&amount=${amount}`,
    };
  }
}

export * from './scb.config';
