import {
  pgTable, uuid, varchar, text,
  numeric, date, timestamp, jsonb, pgEnum
} from 'drizzle-orm/pg-core'
import { users } from './auth'

export const transactionTypeEnum = pgEnum('transaction_type', ['credit', 'debit'])
export const expenseCategoryEnum = pgEnum('expense_category', [
  'utilities', 'salary', 'supplies', 'maintenance', 'other'
])

export const bankTransactions = pgTable('bank_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  scbTransactionId: varchar('scb_transaction_id', { length: 255 }).unique(),
  type: transactionTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  transactionDate: timestamp('transaction_date').notNull(),
  balanceAfter: numeric('balance_after', { precision: 15, scale: 2 }),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const expenses = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  category: expenseCategoryEnum('category').notNull(),
  description: text('description'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  expenseDate: date('expense_date').notNull(),
  createdBy: uuid('created_by').notNull()
    .references(() => users.id),
  receiptUrl: varchar('receipt_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
