import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
  pgEnum,
  foreignKey,
  index,
  date,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { orders } from './orders';

/**
 * Delivery Status
 */
export const deliveryStatusEnum = pgEnum('delivery_status', [
  'ASSIGNED',
  'ON_WAY_PICKUP',
  'ARRIVED_PICKUP',
  'PICKED_UP',
  'ON_WAY_DELIVERY',
  'ARRIVED_DELIVERY',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'RETURNED',
]);

/**
 * Drivers Table
 * Extended driver information (related to users with DRIVER role)
 */
export const drivers = pgTable(
  'drivers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
    
    // License information
    licenseNumber: varchar('license_number', { length: 50 }).notNull().unique(),
    licenseExpiry: date('license_expiry'),
    licensePhotoUrl: text('license_photo_url'),
    
    // Vehicle information
    vehicleType: varchar('vehicle_type', { length: 100 }), // motorcycle, car, van, etc.
    vehiclePlate: varchar('vehicle_plate', { length: 20 }).unique(),
    registrationNumber: varchar('registration_number', { length: 50 }).unique(),
    vehicleInsurance: varchar('vehicle_insurance', { length: 255 }),
    vehicleInsuranceExpiry: date('vehicle_insurance_expiry'),
    
    // Insurance & Documents
    insurancePhotoUrl: text('insurance_photo_url'),
    documentUrl: text('document_url'),
    
    // Status
    isActive: boolean('is_active').default(true),
    isAvailable: boolean('is_available').default(true),
    availableSince: timestamp('available_since', { withTimezone: true }),
    
    // Rating
    averageRating: numeric('average_rating', { precision: 3, scale: 2 }).default('0'),
    totalDeliveries: integer('total_deliveries').default(0),
    successRate: numeric('success_rate', { precision: 5, scale: 2 }).default('0'),
    
    // Contact
    emergencyContact: varchar('emergency_contact', { length: 20 }),
    bankAccount: varchar('bank_account', { length: 50 }),
    bankName: varchar('bank_name', { length: 100 }),
    
    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('drivers_user_id_idx').on(table.userId),
    isAvailableIdx: index('drivers_is_available_idx').on(table.isAvailable),
  })
);

export type Driver = typeof drivers.$inferSelect;
export type NewDriver = typeof drivers.$inferInsert;

/**
 * Delivery Assignments Table
 * Track order assignments to drivers
 */
export const deliveryAssignments = pgTable(
  'delivery_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    driverId: uuid('driver_id').notNull().references(() => drivers.id, { onDelete: 'restrict' }),
    
    // Assignment details
    assignmentType: varchar('assignment_type', { length: 50 }), // PICKUP, DELIVERY, BOTH
    status: deliveryStatusEnum('status').notNull().default('ASSIGNED'),
    priority: integer('priority').default(0), // 0 = normal, 1 = high, 2 = urgent
    
    // Estimated times
    estimatedPickupTime: timestamp('estimated_pickup_time', { withTimezone: true }),
    estimatedDeliveryTime: timestamp('estimated_delivery_time', { withTimezone: true }),
    
    // Actual times
    actualPickupTime: timestamp('actual_pickup_time', { withTimezone: true }),
    actualDeliveryTime: timestamp('actual_delivery_time', { withTimezone: true }),
    
    // Pickup details
    pickupAddress: text('pickup_address'),
    pickupLatitude: numeric('pickup_latitude', { precision: 10, scale: 8 }),
    pickupLongitude: numeric('pickup_longitude', { precision: 11, scale: 8 }),
    pickupPhotos: text('pickup_photos'), // JSON array of photo URLs
    pickupSignature: text('pickup_signature'), // Base64 or URL
    pickupNotes: text('pickup_notes'),
    
    // Delivery details
    deliveryAddress: text('delivery_address'),
    deliveryLatitude: numeric('delivery_latitude', { precision: 10, scale: 8 }),
    deliveryLongitude: numeric('delivery_longitude', { precision: 11, scale: 8 }),
    deliveryPhotos: text('delivery_photos'), // JSON array of photo URLs
    deliverySignature: text('delivery_signature'), // Base64 or URL
    deliveryNotes: text('delivery_notes'),
    customerName: varchar('customer_name', { length: 255 }),
    customerPhone: varchar('customer_phone', { length: 20 }),
    
    // Failure tracking
    failureReason: text('failure_reason'),
    failureAttempts: integer('failure_attempts').default(0),
    
    // Distance & Duration
    estimatedDistance: numeric('estimated_distance', { precision: 8, scale: 2 }), // in km
    actualDistance: numeric('actual_distance', { precision: 8, scale: 2 }),
    estimatedDuration: integer('estimated_duration'), // in minutes
    actualDuration: integer('actual_duration'),
    
    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index('delivery_assignments_order_id_idx').on(table.orderId),
    driverIdIdx: index('delivery_assignments_driver_id_idx').on(table.driverId),
    statusIdx: index('delivery_assignments_status_idx').on(table.status),
  })
);

export type DeliveryAssignment = typeof deliveryAssignments.$inferSelect;
export type NewDeliveryAssignment = typeof deliveryAssignments.$inferInsert;

/**
 * Real-time Driver Location Tracking
 */
export const driverLocationHistory = pgTable(
  'driver_location_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    driverId: uuid('driver_id').notNull().references(() => drivers.id, { onDelete: 'cascade' }),
    assignmentId: uuid('assignment_id').references(() => deliveryAssignments.id, {
      onDelete: 'set null',
    }),
    
    // Location
    latitude: numeric('latitude', { precision: 10, scale: 8 }).notNull(),
    longitude: numeric('longitude', { precision: 11, scale: 8 }).notNull(),
    accuracy: numeric('accuracy', { precision: 8, scale: 2 }), // GPS accuracy in meters
    
    // Speed
    speed: numeric('speed', { precision: 5, scale: 2 }), // km/h
    heading: numeric('heading', { precision: 6, scale: 2 }), // direction in degrees
    
    // Timestamp
    recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    driverIdIdx: index('driver_location_history_driver_id_idx').on(table.driverId),
    assignmentIdIdx: index('driver_location_history_assignment_id_idx').on(table.assignmentId),
    recordedAtIdx: index('driver_location_history_recorded_at_idx').on(table.recordedAt),
  })
);

export type DriverLocationHistory = typeof driverLocationHistory.$inferSelect;
export type NewDriverLocationHistory = typeof driverLocationHistory.$inferInsert;
