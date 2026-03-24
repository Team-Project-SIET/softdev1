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
  index,
} from 'drizzle-orm/pg-core';

/**
 * Service Category
 */
export const serviceCategoryEnum = pgEnum('service_category', [
  'WASH',
  'DRY_CLEAN',
  'SPECIAL_CARE',
  'RUSH_SERVICE',
  'ADDITIONAL_SERVICE',
]);

/**
 * Services Catalog Table
 * Available laundry services and pricing
 */
export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Service info
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: serviceCategoryEnum('category').notNull(),
    
    // Pricing
    basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
    pricePerKg: numeric('price_per_kg', { precision: 10, scale: 2 }),
    pricePerItem: numeric('price_per_item', { precision: 10, scale: 2 }),
    
    // Applicable items
    applicableItemTypes: text('applicable_item_types'), // JSON array or comma-separated
    
    // Processing time
    estimatedDays: integer('estimated_days').default(3),
    isRushAvailable: boolean('is_rush_available').default(false),
    rushPrice: numeric('rush_price', { precision: 10, scale: 2 }),
    
    // Service details
    icon: varchar('icon', { length: 255 }), // Icon name or URL
    color: varchar('color', { length: 7 }), // Hex color
    
    // Status
    isActive: boolean('is_active').default(true),
    displayOrder: integer('display_order').default(0),
    
    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index('services_category_idx').on(table.category),
    isActiveIdx: index('services_is_active_idx').on(table.isActive),
  })
);

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

/**
 * Service Pricing Rules Table
 * Volume-based or membership-based pricing adjustments
 */
export const servicePricingRules = pgTable(
  'service_pricing_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    
    // Rule type
    ruleType: varchar('rule_type', { length: 50 }).notNull(), // VOLUME, MEMBERSHIP, BULK, PROMOTION
    
    // Conditions
    minQuantity: integer('min_quantity'),
    maxQuantity: integer('max_quantity'),
    applicableMembership: varchar('applicable_membership', { length: 50 }), // VIP, STANDARD
    
    // Discount
    discountType: varchar('discount_type', { length: 20 }), // PERCENTAGE, FIXED
    discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
    
    // Validity
    validFrom: timestamp('valid_from', { withTimezone: true }),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    isActive: boolean('is_active').default(true),
    
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    serviceIdIdx: index('service_pricing_rules_service_id_idx').on(table.serviceId),
  })
);

export type ServicePricingRule = typeof servicePricingRules.$inferSelect;
export type NewServicePricingRule = typeof servicePricingRules.$inferInsert;
