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
 * User Roles Enum
 * - ADMIN: System administrator
 * - STAFF: Shop staff (order processing, workflow management)
 * - DRIVER: Delivery driver
 * - CUSTOMER: General customer (B2C via LINE OA or Web)
 */
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'STAFF', 'DRIVER', 'CUSTOMER']);

/**
 * Membership Level for Customers
 */
export const membershipLevelEnum = pgEnum('membership_level', ['STANDARD', 'VIP']);

/**
 * Users Table
 * Stores information for all user types: Admin, Staff, Driver, Customer
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Basic info
    email: varchar('email', { length: 255 }).unique(),
    password: varchar('password', { length: 255 }),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    
    // User role
    role: userRoleEnum('role').notNull().default('CUSTOMER'),
    
    // LINE integration for B2C customers
    lineUserId: varchar('line_user_id', { length: 255 }).unique(),
    lineDisplayName: varchar('line_display_name', { length: 255 }),
    linePictureUrl: text('line_picture_url'),
    
    // Address (for delivery)
    address: text('address'),
    city: varchar('city', { length: 100 }),
    postalCode: varchar('postal_code', { length: 10 }),
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),
    
    // Membership (for customers)
    membershipLevel: membershipLevelEnum('membership_level').default('STANDARD'),
    membershipExpiryDate: timestamp('membership_expiry_date', { withTimezone: true }),
    loyaltyPoints: integer('loyalty_points').default(0),
    
    // Driver specific fields
    licenseNumber: varchar('license_number', { length: 50 }), // Only for DRIVER role
    isActive: boolean('is_active').default(true),
    
    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    lineUserIdIdx: index('users_line_user_id_idx').on(table.lineUserId),
    phoneIdx: index('users_phone_idx').on(table.phone),
    roleIdx: index('users_role_idx').on(table.role),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
