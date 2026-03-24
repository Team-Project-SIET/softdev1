import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  pgEnum,
  foreignKey,
  index,
  boolean,
} from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { users } from './users';

/**
 * Transaction Type Enum
 * INCOME: Money in (payments from customers)
 * EXPENSE: Money out (payments, supplies, salaries)
 */
export const transactionTypeEnum = pgEnum('transaction_type', ['INCOME', 'EXPENSE']);

/**
 * Transaction Status
 */
export const transactionStatusEnum = pgEnum('transaction_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
]);

/**
 * Payment Method
 */
export const paymentMethodEnum = pgEnum('payment_method', [
  'SCB_QR',
  'SCB_TRANSFER',
  'CREDIT_CARD',
  'CASH',
  'BANK_TRANSFER',
]);

/**
 * Transactions Table - SCB Developer API Integration
 * Stores all financial transactions pulled from SCB API
 * Reference: SCB Sandbox API for payment data
 */
export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // SCB API Reference
    scbTransactionId: varchar('scb_transaction_id', { length: 255 }).unique(),
    scbReferenceNo: varchar('scb_reference_no', { length: 255 }), // SCB reference number
    
    // Transaction details
    type: transactionTypeEnum('type').notNull(), // INCOME or EXPENSE
    status: transactionStatusEnum('status').notNull().default('PENDING'),
    paymentMethod: paymentMethodEnum('payment_method'),
    
    // Amount
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('THB'),
    
    // Relationships
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }), // Customer or staff
    
    // Details
    description: text('description'),
    category: varchar('category', { length: 100 }), // e.g., "Service Payment", "Refund", "Operating Expense"
    notes: text('notes'),
    
    // SCB API Response metadata
    scbMerchantId: varchar('scb_merchant_id', { length: 100 }), // Merchant ID from SCB
    scbChannelId: varchar('scb_channel_id', { length: 100 }), // Channel ID from SCB
    scbInvocieNo: varchar('scb_invoice_no', { length: 100 }), // Invoice number from SCB
    scbTerminalId: varchar('scb_terminal_id', { length: 100 }), // Terminal ID from SCB
    scbRawResponse: text('scb_raw_response'), // Store full SCB API response for audit
    
    // Document trails
    proofOfPaymentUrl: text('proof_of_payment_url'), // Receipt image/PDF URL
    receiptNumber: varchar('receipt_number', { length: 100 }),
    invoiceNumber: varchar('invoice_number', { length: 100 }),
    
    // Reconciliation
    isReconciled: boolean('is_reconciled').default(false),
    reconciledAt: timestamp('reconciled_at', { withTimezone: true }),
    reconciledBy: uuid('reconciled_by').references(() => users.id, { onDelete: 'set null' }),
    
    // Timestamps
    transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull(),
    processedDate: timestamp('processed_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    scbTransactionIdIdx: index('transactions_scb_transaction_id_idx').on(table.scbTransactionId),
    orderIdIdx: index('transactions_order_id_idx').on(table.orderId),
    userIdIdx: index('transactions_user_id_idx').on(table.userId),
    typeIdx: index('transactions_type_idx').on(table.type),
    statusIdx: index('transactions_status_idx').on(table.status),
    transactionDateIdx: index('transactions_transaction_date_idx').on(table.transactionDate),
  })
);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

/**
 * Transaction Logs Table
 * Audit trail for transaction status changes
 */
export const transactionLogs = pgTable(
  'transaction_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    
    fromStatus: varchar('from_status', { length: 50 }),
    toStatus: varchar('to_status', { length: 50 }).notNull(),
    reason: text('reason'),
    changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }),
    
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    transactionIdIdx: index('transaction_logs_transaction_id_idx').on(table.transactionId),
  })
);

export type TransactionLog = typeof transactionLogs.$inferSelect;
export type NewTransactionLog = typeof transactionLogs.$inferInsert;
