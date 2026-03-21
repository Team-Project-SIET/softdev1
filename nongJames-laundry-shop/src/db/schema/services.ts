import {
  pgTable, uuid, varchar, text,
  numeric, boolean, timestamp, pgEnum
} from 'drizzle-orm/pg-core'

export const serviceUnitEnum = pgEnum('service_unit', [
  'per_kg', 'per_piece', 'per_set'
])

export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
  unit: serviceUnitEnum('unit').notNull().default('per_kg'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
    .$onUpdate(() => new Date()),
})