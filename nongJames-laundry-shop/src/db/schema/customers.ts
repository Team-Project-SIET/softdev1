import {
  pgTable, uuid, varchar, text,
  boolean, numeric, integer,
  date, timestamp, pgEnum
} from 'drizzle-orm/pg-core'
import { users } from './auth'

export const customerTypeEnum = pgEnum('customer_type', ['b2c', 'b2b'])
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active', 'expired', 'cancelled'
])

export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  type: customerTypeEnum('type').notNull().default('b2c'),
  isGuest: boolean('is_guest').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const b2bContracts = pgTable('b2b_contracts', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  contractStart: date('contract_start').notNull(),
  contractEnd: date('contract_end').notNull(),
  specialPrice: numeric('special_price', { precision: 10, scale: 2 }),
  paymentTerms: text('payment_terms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  durationDays: integer('duration_days').notNull(),
  freeDelivery: boolean('free_delivery').notNull().default(false),
  discountPercent: numeric('discount_percent', { precision: 5, scale: 2 })
    .notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id').notNull()
    .references(() => subscriptionPlans.id),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
