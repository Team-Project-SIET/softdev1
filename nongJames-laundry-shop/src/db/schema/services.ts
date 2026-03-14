import {
  pgTable, uuid, varchar, text,
  decimal, boolean, timestamp, pgEnum
} from 'drizzle-orm/pg-core'

export const serviceUnitEnum = pgEnum('service_unit', [
  'per_kg',    // ซักทั่วไป คิดต่อกิโล
  'per_piece', // ซักชิ้น เช่น สูท, รองเท้า
  'per_set',   // ซักชุด เช่น ผ้าปูที่นอน
])

export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),        // "ซักรีดทั่วไป"
  description: text('description'),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  unit: serviceUnitEnum('unit').notNull().default('per_kg'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
    .$onUpdateFn(() => new Date()),
})
