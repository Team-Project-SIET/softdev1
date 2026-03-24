import { db } from '@/db';
import { payments, orders, transactions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ScbClient } from '@/integrations/scb/scb.client';

/**
 * Payment Service
 * Handles payment creation, processing, and status tracking
 */
export class PaymentService {
  private scbClient = new ScbClient();

  /**
   * Create payment record for order
   */
  async createPayment(
    orderId: string,
    amount: number,
    method: 'CASH' | 'CREDIT_CARD' | 'SCB_QR' | 'SCB_TRANSFER' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'LINE_PAY' | 'PAYPAL' = 'CASH'
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

      // Create payment record
      const [payment] = await db
        .insert(payments)
        .values({          paymentNumber: `PAY-${Date.now()}`,          orderId,
          amount: amount.toString(),
          paymentMethod: method,
          status: 'PENDING',
        })
        .returning();

      console.log(`[PAYMENT] Created: ${payment.id} for Order ${orderId} - ${method} ${amount}`);
      return payment;
    } catch (error) {
      console.error('[PAYMENT] Creation error:', error);
      throw error;
    }
  }

  /**
   * Initiate SCB payment
   */
  async initiateSCBPayment(paymentId: string, returnUrl: string): Promise<any> {
    try {
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (!payment) {
        throw new Error('Payment not found');
      }

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, payment.orderId))
        .limit(1);

      if (!order) {
        throw new Error('Order not found');
      }

      // Create SCB payment request
      const scbResult = await this.scbClient.createPaymentRequest(
        payment.orderId,
        parseFloat(payment.amount),
        order.orderNumber,
        returnUrl,
        `Payment for Order #${order.orderNumber}`
      );

      if (!scbResult.success) {
        throw new Error(scbResult.error || 'SCB payment request failed');
      }

      // Update payment with SCB reference
      const [updatedPayment] = await db
        .update(payments)
        .set({
          scbTransactionId: scbResult.transactionRef,
          scbPaymentUrl: scbResult.paymentUrl,
        })
        .where(eq(payments.id, paymentId))
        .returning();

      console.log(`[PAYMENT] SCB initiated: ${paymentId} -> ${scbResult.transactionRef}`);
      return {
        paymentId,
        paymentUrl: scbResult.paymentUrl,
        transactionRef: scbResult.transactionRef,
      };
    } catch (error) {
      console.error('[PAYMENT] SCB initiation error:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<any> {
    try {
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (!payment) {
        throw new Error('Payment not found');
      }

      return payment;
    } catch (error) {
      console.error('[PAYMENT] Get error:', error);
      throw error;
    }
  }

  /**
   * Get all payments for order
   */
  async getOrderPayments(orderId: string): Promise<any[]> {
    try {
      const orderPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.orderId, orderId));

      return orderPayments;
    } catch (error) {
      console.error('[PAYMENT] Get order payments error:', error);
      throw error;
    }
  }

  /**
   * Process payment (mark as completed)
   */
  async processPayment(paymentId: string): Promise<any> {
    try {
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update payment status
      const [updatedPayment] = await db
        .update(payments)
        .set({
          status: 'COMPLETED' as any,
          completedAt: new Date(),
        })
        .where(eq(payments.id, paymentId))
        .returning();

      // Create transaction record
      await db.insert(transactions).values({
        type: 'INCOME' as any,
        amount: payment.amount,
        description: `Payment from Order ${payment.orderId}`,
        status: 'COMPLETED' as any,
        scbTransactionId: payment.scbTransactionId,
        orderId: payment.orderId,
        transactionDate: new Date(),
      });

      console.log(`[PAYMENT] Processed: ${paymentId}`);
      return updatedPayment;
    } catch (error) {
      console.error('[PAYMENT] Process error:', error);
      throw error;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, reason?: string): Promise<any> {
    try {
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'COMPLETED') {
        throw new Error('Only completed payments can be refunded');
      }

      // Update payment
      const [refundedPayment] = await db
        .update(payments)
        .set({
          status: 'REFUNDED' as any,
          isRefunded: true,
          refundAmount: payment.amount,
          refundDate: new Date(),
          refundReason: reason,
        })
        .where(eq(payments.id, paymentId))
        .returning();

      // Create refund transaction
      await db.insert(transactions).values({
        type: 'EXPENSE' as any,
        amount: payment.amount,
        description: `Refund for Payment ${paymentId}. Reason: ${reason || 'Not specified'}`,
        status: 'COMPLETED' as any,
        scbTransactionId: `REFUND-${payment.scbTransactionId}`,
        orderId: payment.orderId,
        transactionDate: new Date(),
      });

      console.log(`[PAYMENT] Refunded: ${paymentId} - ${reason}`);
      return refundedPayment;
    } catch (error) {
      console.error('[PAYMENT] Refund error:', error);
      throw error;
    }
  }
}
