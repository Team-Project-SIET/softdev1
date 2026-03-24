import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  boolean,
  pgEnum,
  integer,
  foreignKey,
  index,
  date,
} from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { users } from './users';

/**
 * Invoice Status
 */
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'DRAFT',
  'ISSUED',
  'SENT',
  'PAID',
  'OVERDUE',
  'CANCELLED',
  'REFUNDED',
]);

/**
 * Invoices Table
 * Generate invoices for orders
 */
export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invoiceNumber: varchar('invoice_number', { length: 100 }).unique().notNull(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
    
    // Dates
    invoiceDate: date('invoice_date').notNull(),
    dueDate: date('due_date'),
    paidDate: date('paid_date'),
    
    // Amounts
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
    discount: numeric('discount', { precision: 12, scale: 2 }).default('0'),
    tax: numeric('tax', { precision: 12, scale: 2 }).default('0'),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
    paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).default('0'),
    remainingAmount: numeric('remaining_amount', { precision: 12, scale: 2 }).notNull(),
    
    // Status & Documents
    status: invoiceStatusEnum('status').notNull().default('DRAFT'),
    invoiceDocumentUrl: text('invoice_document_url'), // PDF URL
    notes: text('notes'),
    paymentTerms: varchar('payment_terms', { length: 50 }), // NET15, NET30, etc.
    
    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index('invoices_order_id_idx').on(table.orderId),
    invoiceNumberIdx: index('invoices_invoice_number_idx').on(table.invoiceNumber),
    statusIdx: index('invoices_status_idx').on(table.status),
    dueDateIdx: index('invoices_due_date_idx').on(table.dueDate),
  })
);

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

/**
 * Financial Reports Snapshot
 * Daily/Monthly financial summary for Dashboard
 */
export const financialReports = pgTable(
  'financial_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Period
    reportDate: date('report_date').notNull(),
    reportType: varchar('report_type', { length: 50 }).notNull(), // DAILY, WEEKLY, MONTHLY, YEARLY
    
    // Income
    totalIncome: numeric('total_income', { precision: 12, scale: 2 }).notNull().default('0'),
    orderCount: integer('order_count').default(0),
    averageOrderValue: numeric('average_order_value', { precision: 12, scale: 2 }).default('0'),
    
    // Expenses
    totalExpenses: numeric('total_expenses', { precision: 12, scale: 2 }).notNull().default('0'),
    
    // Profit/Loss
    totalProfit: numeric('total_profit', { precision: 12, scale: 2 }).notNull().default('0'),
    profitMargin: numeric('profit_margin', { precision: 5, scale: 2 }).default('0'), // percentage
    
    // Payment breakdown
    cashPayments: numeric('cash_payments', { precision: 12, scale: 2 }).default('0'),
    scbPayments: numeric('scb_payments', { precision: 12, scale: 2 }).default('0'),
    transferPayments: numeric('transfer_payments', { precision: 12, scale: 2 }).default('0'),
    
    // Refunds
    totalRefunds: numeric('total_refunds', { precision: 12, scale: 2 }).default('0'),
    
    // Notes
    notes: text('notes'),
    
    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    reportDateIdx: index('financial_reports_report_date_idx').on(table.reportDate),
    reportTypeIdx: index('financial_reports_report_type_idx').on(table.reportType),
  })
);

export type FinancialReport = typeof financialReports.$inferSelect;
export type NewFinancialReport = typeof financialReports.$inferInsert;

/**
 * Account Ledger
 * Detailed transaction ledger for accounting
 */
export const accountLedger = pgTable(
  'account_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Transaction reference
    transactionDate: date('transaction_date').notNull(),
    description: text('description').notNull(),
    referenceId: varchar('reference_id', { length: 255 }), // Invoice, Order, or Transaction ID
    
    // Accounts
    accountCode: varchar('account_code', { length: 50 }).notNull(), // Chart of Accounts
    accountName: varchar('account_name', { length: 255 }).notNull(),
    
    // Amounts
    debit: numeric('debit', { precision: 12, scale: 2 }).default('0'),
    credit: numeric('credit', { precision: 12, scale: 2 }).default('0'),
    balance: numeric('balance', { precision: 12, scale: 2 }).notNull(),
    
    // Details
    category: varchar('category', { length: 100 }), // REVENUE, EXPENSE, ASSET, LIABILITY
    notes: text('notes'),
    
    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    transactionDateIdx: index('account_ledger_transaction_date_idx').on(table.transactionDate),
    accountCodeIdx: index('account_ledger_account_code_idx').on(table.accountCode),
  })
);

export type AccountLedger = typeof accountLedger.$inferSelect;
export type NewAccountLedger = typeof accountLedger.$inferInsert;
