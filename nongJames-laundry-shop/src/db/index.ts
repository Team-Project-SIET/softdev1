import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// import ทุก schema
import * as authSchema from './schema/auth'
import * as customersSchema from './schema/customers'
import * as servicesSchema from './schema/services'
import * as ordersSchema from './schema/orders'
import * as logisticsSchema from './schema/logistics'
import * as paymentsSchema from './schema/payments'
import * as financeSchema from './schema/finance'
import * as notificationsSchema from './schema/notifications'

// สร้าง postgres client
const client = postgres(process.env.DATABASE_URL!, {
  max: 10, // connection pool สูงสุด 10 connections
})

// สร้าง drizzle instance พร้อม schema ทั้งหมด (ใช้ทำ query แบบ relational ได้)
export const db = drizzle(client, {
  schema: {
    ...authSchema,
    ...customersSchema,
    ...servicesSchema,
    ...ordersSchema,
    ...logisticsSchema,
    ...paymentsSchema,
    ...financeSchema,
    ...notificationsSchema,
  },
})

// re-export ทุก schema ออกไปใช้ที่อื่นได้เลย
export * from './schema/auth'
export * from './schema/customers'
export * from './schema/services'
export * from './schema/orders'
export * from './schema/logistics'
export * from './schema/payments'
export * from './schema/finance'
export * from './schema/notifications'
