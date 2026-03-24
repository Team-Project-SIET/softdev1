import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  pgEnum,
  foreignKey,
  index,
  date,
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Contract Status
 */
export const contractStatusEnum = pgEnum('contract_status', [
  'DRAFT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'SUSPENDED',
  'EXPIRED',
  'TERMINATED',
]);

/**
 * Contract Type
 */
export const contractTypeEnum = pgEnum('contract_type', [
  'SERVICE_AGREEMENT',
  'MONTHLY_SUBSCRIPTION',
  'ANNUAL_MEMBERSHIP',
  'CORPORATE_ACCOUNT',
]);

/**
 * Contracts Table - B2B Corporate Clients
 * Stores contract information for business customers
 */
export const contracts = pgTable(
  'contracts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Contract identification
    contractNumber: varchar('contract_number', { length: 100 }).unique().notNull(),
    contractType: contractTypeEnum('contract_type').notNull(),
    
    // Client information
    clientId: uuid('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    clientName: varchar('client_name', { length: 255 }).notNull(),
    taxId: varchar('tax_id', { length: 50 }), // Business tax ID
    businessRegistration: varchar('business_registration', { length: 100 }),
    
    // Contact information
    contactPerson: varchar('contact_person', { length: 255 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 20 }),
    
    // Address
    billingAddress: text('billing_address'),
    billingCity: varchar('billing_city', { length: 100 }),
    billingPostalCode: varchar('billing_postal_code', { length: 10 }),
    
    deliveryAddress: text('delivery_address'),
    deliveryCity: varchar('delivery_city', { length: 100 }),
    deliveryPostalCode: varchar('delivery_postal_code', { length: 10 }),
    deliveryLatitude: numeric('delivery_latitude', { precision: 10, scale: 8 }),
    deliveryLongitude: numeric('delivery_longitude', { precision: 11, scale: 8 }),
    
    // Contract terms
    status: contractStatusEnum('status').notNull().default('DRAFT'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    autoRenewal: boolean('auto_renewal').default(false),
    renewalNoticeDays: integer('renewal_notice_days').default(30),
    
    // Pricing
    monthlyBasePrice: numeric('monthly_base_price', { precision: 10, scale: 2 }),
    annualBasePrice: numeric('annual_base_price', { precision: 10, scale: 2 }),
    discountPercentage: numeric('discount_percentage', { precision: 5, scale: 2 }).default('0'),
    discountNotes: text('discount_notes'),
    
    // Service details
    includedServices: text('included_services'), // JSON or comma-separated
    maxMonthlyOrders: integer('max_monthly_orders'),
    averageMonthlyOrders: integer('average_monthly_orders'),
    priorityPickupDelivery: boolean('priority_pickup_delivery').default(false),
    dedicatedDriver: boolean('dedicated_driver').default(false),
    preferredDriver: uuid('preferred_driver_id').references(() => users.id, { onDelete: 'set null' }),
    
    // Payment terms
    paymentTerms: varchar('payment_terms', { length: 50 }), // NET15, NET30, NET45, COD
    paymentMethod: varchar('payment_method', { length: 50 }), // BANK_TRANSFER, SCB, etc.
    creditLimit: numeric('credit_limit', { precision: 12, scale: 2 }),
    currentBalance: numeric('current_balance', { precision: 12, scale: 2 }).default('0'),
    
    // Agreement details
    contractDocument: text('contract_document'), // URL to PDF or S3
    specialConditions: text('special_conditions'),
    
    // Account manager
    accountManager: uuid('account_manager_id').references(() => users.id, { onDelete: 'set null' }),
    
    // Status tracking
    isActive: boolean('is_active').default(true),
    suspensionReason: text('suspension_reason'),
    terminationReason: text('termination_reason'),
    terminatedAt: timestamp('terminated_at', { withTimezone: true }),
    
    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    clientIdIdx: index('contracts_client_id_idx').on(table.clientId),
    contractNumberIdx: index('contracts_contract_number_idx').on(table.contractNumber),
    statusIdx: index('contracts_status_idx').on(table.status),
    startDateIdx: index('contracts_start_date_idx').on(table.startDate),
    endDateIdx: index('contracts_end_date_idx').on(table.endDate),
  })
);

export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;

/**
 * Contract Line Items Table
 * Detailed services included in each contract
 */
export const contractLineItems = pgTable(
  'contract_line_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contract_id')
      .notNull()
      .references(() => contracts.id, { onDelete: 'cascade' }),
    
    // Service details
    serviceName: varchar('service_name', { length: 255 }).notNull(),
    serviceDescription: text('service_description'),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    
    // Pricing
    discount: numeric('discount', { precision: 10, scale: 2 }).default('0'),
    totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
    
    // Validity
    isActive: boolean('is_active').default(true),
    notes: text('notes'),
    
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    contractIdIdx: index('contract_line_items_contract_id_idx').on(table.contractId),
  })
);

export type ContractLineItem = typeof contractLineItems.$inferSelect;
export type NewContractLineItem = typeof contractLineItems.$inferInsert;

/**
 * Contract History Table
 * Audit trail for contract changes (status, pricing, terms)
 */
export const contractHistory = pgTable(
  'contract_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contract_id')
      .notNull()
      .references(() => contracts.id, { onDelete: 'cascade' }),
    
    changeType: varchar('change_type', { length: 50 }).notNull(), // STATUS, PRICING, TERMS, etc.
    fromValue: text('from_value'),
    toValue: text('to_value'),
    reason: text('reason'),
    changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }),
    
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    contractIdIdx: index('contract_history_contract_id_idx').on(table.contractId),
  })
);

export type ContractHistory = typeof contractHistory.$inferSelect;
export type NewContractHistory = typeof contractHistory.$inferInsert;
