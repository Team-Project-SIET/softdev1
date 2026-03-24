import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  integer,
  decimal,
  index,
} from 'drizzle-orm/pg-core';

/**
 * Customer Type Enum
 */
export const customerTypeEnum = pgEnum('customer_type', ['INDIVIDUAL', 'BUSINESS', 'B2B']);

/**
 * Customers Table
 * Extended customer information (related to users with CUSTOMER role)
 */
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').unique(), // Optional link to users table

    // Basic info
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),

    // Customer type
    customerType: customerTypeEnum('customer_type').default('INDIVIDUAL'),

    // Address
    address: text('address'),
    city: varchar('city', { length: 100 }),
    postalCode: varchar('postal_code', { length: 10 }),
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),

    // Business info (for B2B)
    companyName: varchar('company_name', { length: 255 }),
    taxId: varchar('tax_id', { length: 50 }),
    contractId: uuid('contract_id'), // Link to B2B contract

    // Loyalty
    loyaltyPoints: integer('loyalty_points').default(0),
    membershipLevel: varchar('membership_level', { length: 50 }).default('STANDARD'),

    // Status
    isActive: boolean('is_active').default(true),
    isVerified: boolean('is_verified').default(false),

    // Notes
    notes: text('notes'),

    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('customers_user_id_idx').on(table.userId),
    emailIdx: index('customers_email_idx').on(table.email),
    phoneIdx: index('customers_phone_idx').on(table.phone),
    nameIdx: index('customers_name_idx').on(table.name),
  })
);

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
