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
  date,
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Expense Category Enum
 */
export const expenseCategoryEnum = pgEnum('expense_category', [
  'utilities',
  'salary',
  'supplies',
  'maintenance',
  'other',
]);

/**
 * Expenses Table
 * Track business expenses for P&L reporting
 */
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Expense details
    category: expenseCategoryEnum('category').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    description: text('description'),

    // Date
    expenseDate: date('expense_date').notNull(),

    // Receipt
    receiptUrl: text('receipt_url'),
    receiptNumber: varchar('receipt_number', { length: 100 }),

    // Reference
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),

    // Status
    isApproved: varchar('is_approved', { length: 20 }).default('pending'), // pending, approved, rejected

    // Notes
    notes: text('notes'),

    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index('expenses_category_idx').on(table.category),
    expenseDateIdx: index('expenses_expense_date_idx').on(table.expenseDate),
    createdByIdx: index('expenses_created_by_idx').on(table.createdBy),
  })
);

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
