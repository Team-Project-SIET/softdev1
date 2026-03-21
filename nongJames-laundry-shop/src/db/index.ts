import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as authSchema from './schema/auth'
import * as customersSchema from './schema/customers'
import * as servicesSchema from './schema/services'
import * as ordersSchema from './schema/orders'
import * as logisticsSchema from './schema/logistics'
import * as paymentsSchema from './schema/payments'
import * as financeSchema from './schema/finance'
import * as notificationsSchema from './schema/notifications'

const client = postgres(process.env.DATABASE_URL!)

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

export * from './schema/auth'
export * from './schema/customers'
export * from './schema/services'
export * from './schema/orders'
export * from './schema/logistics'
export * from './schema/payments'
export * from './schema/finance'
export * from './schema/notifications'
