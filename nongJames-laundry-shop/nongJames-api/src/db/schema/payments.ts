import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  boolean,
  pgEnum,
  foreignKey,
  index,
} from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { users } from './users';

/**
 * Payment Status
 */
export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'DISPUTED',
]);

/**
 * Payment Method
 */
export const paymentMethodEnum = pgEnum('payment_method', [
  'SCB_QR',
  'SCB_TRANSFER',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CASH',
  'BANK_TRANSFER',
  'LINE_PAY',
  'PAYPAL',
]);

/**
 * Payments Table
 * Tracks all payments related to orders
 */
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Reference
    paymentNumber: varchar('payment_number', { length: 100 }).unique().notNull(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    
    // Payment details
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    status: paymentStatusEnum('status').notNull().default('PENDING'),
    
    // SCB Integration
    scbTransactionId: varchar('scb_transaction_id', { length: 255 }).unique(),
    scbReferenceNo: varchar('scb_reference_no', { length: 255 }),
    scbQrCode: text('scb_qr_code'), // Base64 encoded QR code
    scbPaymentUrl: text('scb_payment_url'),
    
    // Payment proof
    proofOfPaymentUrl: text('proof_of_payment_url'), // Receipt image
    transactionHash: varchar('transaction_hash', { length: 255 }), // For verification
    
    // Dates
    initiatedAt: timestamp('initiated_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    
    // Additional info
    notes: text('notes'),
    failureReason: text('failure_reason'),
    
    // Refund tracking
    isRefunded: boolean('is_refunded').default(false),
    refundAmount: numeric('refund_amount', { precision: 12, scale: 2 }),
    refundDate: timestamp('refund_date', { withTimezone: true }),
    refundReason: text('refund_reason'),
    
    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index('payments_order_id_idx').on(table.orderId),
    scbTransactionIdIdx: index('payments_scb_transaction_id_idx').on(table.scbTransactionId),
    statusIdx: index('payments_status_idx').on(table.status),
    paymentMethodIdx: index('payments_payment_method_idx').on(table.paymentMethod),
  })
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

/**
 * Payment Logs Table
 * Audit trail for payment status changes
 */
export const paymentLogs = pgTable(
  'payment_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => payments.id, { onDelete: 'cascade' }),
    
    fromStatus: varchar('from_status', { length: 50 }),
    toStatus: varchar('to_status', { length: 50 }).notNull(),
    reason: text('reason'),
    changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }),
    
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    paymentIdIdx: index('payment_logs_payment_id_idx').on(table.paymentId),
  })
);

export type PaymentLog = typeof paymentLogs.$inferSelect;
export type NewPaymentLog = typeof paymentLogs.$inferInsert;
