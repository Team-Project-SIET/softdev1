import { 
  pgTable, uuid, doublePrecision, timestamp, integer 
} from 'drizzle-orm/pg-core'
import { orders } from './orders'

export const locations = pgTable('locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  speed: doublePrecision('speed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})