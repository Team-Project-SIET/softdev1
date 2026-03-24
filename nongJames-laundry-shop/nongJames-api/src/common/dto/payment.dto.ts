import { t, Static } from 'elysia';
import { PaymentStatus } from '../enums';

// ════════════════════════════════════════════════════════════════════════════
// PAYMENT SCHEMAS & TYPES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Schema for creating a payment record
 * Used when initiating payment for an order
 */
export const CreatePaymentSchema = t.Object({
  orderId: t.String({ minLength: 1, description: 'Order ID' }),
  amount: t.Number({ minimum: 0.01, description: 'Payment amount (THB)' }),
  paymentMethod: t.Enum(
    {
      SCB: 'SCB',
      CASH: 'CASH',
      TRANSFER: 'TRANSFER',
      CREDIT_CARD: 'CREDIT_CARD',
      QR_CODE: 'QR_CODE',
    },
    { description: 'Payment method' }
  ),
  description: t.Optional(t.String({ description: 'Payment description' })),
});

/**
 * TypeScript interface for payment creation
 */
export type CreatePayment = Static<typeof CreatePaymentSchema>;

/**
 * Schema for payment response
 * Complete payment record with status and transaction details
 */
export const PaymentResponseSchema = t.Object({
  id: t.String({ description: 'Payment ID' }),
  orderId: t.String({ description: 'Order ID' }),
  amount: t.Number({ description: 'Payment amount (THB)' }),
  status: t.Enum(
    {
      PENDING: 'PENDING',
      PROCESSING: 'PROCESSING',
      COMPLETED: 'COMPLETED',
      FAILED: 'FAILED',
      REFUNDED: 'REFUNDED',
    },
    { description: 'Payment status' }
  ),
  paymentMethod: t.String({ description: 'Payment method used' }),
  transactionRef: t.Optional(t.String({ description: 'External transaction reference (e.g., SCB ref)' })),
  paidAt: t.Optional(t.Date({ description: 'When payment was completed' })),
  createdAt: t.Date({ description: 'Creation timestamp' }),
  updatedAt: t.Optional(t.Date({ description: 'Last update timestamp' })),
});

/**
 * TypeScript interface for payment responses
 */
export type PaymentResponse = Static<typeof PaymentResponseSchema>;

/**
 * Schema for paginated payment list
 */
export const PaymentListSchema = t.Object({
  payments: t.Array(PaymentResponseSchema),
  pagination: t.Object({
    page: t.Number({ minimum: 1 }),
    limit: t.Number({ minimum: 1, maximum: 100 }),
    total: t.Number({ minimum: 0 }),
    pages: t.Number({ minimum: 1 }),
  }),
});

/**
 * TypeScript interface for paginated payments
 */
export type PaymentList = Static<typeof PaymentListSchema>;

/**
 * Schema for refund request
 */
export const RefundPaymentSchema = t.Object({
  reason: t.Optional(t.String({ description: 'Refund reason' })),
});

/**
 * TypeScript interface for refund requests
 */
export type RefundPayment = Static<typeof RefundPaymentSchema>;

// ════════════════════════════════════════════════════════════════════════════
// LEGACY CLASS EXPORTS (For backward compatibility if needed)
// Prefer using the schemas and interfaces above for new code
// ════════════════════════════════════════════════════════════════════════════

/**
 * @deprecated Use CreatePaymentSchema and CreatePayment type instead
 */
export class CreatePaymentDTO implements CreatePayment {
  orderId!: string;
  amount!: number;
  paymentMethod!: 'SCB' | 'CASH' | 'TRANSFER' | 'CREDIT_CARD' | 'QR_CODE';
  description?: string;

  constructor(data: CreatePayment) {
    this.orderId = data.orderId;
    this.amount = data.amount;
    this.paymentMethod = data.paymentMethod as any;
    this.description = data.description;
  }
}

/**
 * @deprecated Use PaymentResponseSchema and PaymentResponse type instead
 */
export class PaymentResponseDTO implements PaymentResponse {
  id!: string;
  orderId!: string;
  amount!: number;
  status!: PaymentStatus;
  paymentMethod!: string;
  transactionRef?: string;
  paidAt?: Date;
  createdAt!: Date;
  updatedAt?: Date;

  constructor(data: PaymentResponse) {
    this.id = data.id;
    this.orderId = data.orderId;
    this.amount = data.amount;
    this.status = data.status as PaymentStatus;
    this.paymentMethod = data.paymentMethod;
    this.transactionRef = data.transactionRef;
    this.paidAt = data.paidAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
