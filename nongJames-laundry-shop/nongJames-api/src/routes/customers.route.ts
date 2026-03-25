import Elysia, { t } from 'elysia'
import { eq, desc } from 'drizzle-orm'
import { db, customers, orders, subscriptions, subscriptionPlans } from '../db'
import { authPlugin, requireRole, requireAuth } from '../middlewares/auth.middleware'

export const customerRoutes = new Elysia({ prefix: '/customers' })
  .use(authPlugin(process.env.JWT_SECRET!))

  .get('/', async () => {
    const result = await db.select().from(customers).orderBy(desc(customers.createdAt))
    return { success: true, message: 'ok', data: result }
  }, {
    tags:    ['Customers'],
    summary: 'ดูรายการลูกค้าทั้งหมด',
    detail:  {
      description: '**Role:** admin, staff',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireRole(['admin', 'staff'])],
  })

  .get('/:id', async ({ params, set }) => {
    const customer = await db.select().from(customers)
      .where(eq(customers.id, params.id)).limit(1).then(r => r[0])
    if (!customer) {
      set.status = 404
      return { success: false, message: 'ไม่พบลูกค้า', data: null }
    }
    return { success: true, message: 'ok', data: customer }
  }, {
    tags:    ['Customers'],
    summary: 'ดูข้อมูลลูกค้ารายคน',
    detail:  {
      description: '**Role:** admin, staff',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireRole(['admin', 'staff'])],
    params: t.Object({ id: t.String({ description: 'Customer UUID' }) }),
  })

  .get('/:id/orders', async ({ params }) => {
    const result = await db.select().from(orders)
      .where(eq(orders.customerId, params.id))
      .orderBy(desc(orders.createdAt))
    return { success: true, message: 'ok', data: result }
  }, {
    tags:    ['Customers'],
    summary: 'ดู Orders ของลูกค้าคนนี้',
    detail:  {
      description: '**Role:** admin, staff',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireRole(['admin', 'staff'])],
    params: t.Object({ id: t.String({ description: 'Customer UUID' }) }),
  })

  .get('/:id/subscription', async ({ params }) => {
    const sub = await db.select({
      id:              subscriptions.id,
      status:          subscriptions.status,
      startDate:       subscriptions.startDate,
      endDate:         subscriptions.endDate,
      planName:        subscriptionPlans.name,
      freeDelivery:    subscriptionPlans.freeDelivery,
      discountPercent: subscriptionPlans.discountPercent,
    })
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(eq(subscriptions.customerId, params.id))
    .limit(1).then(r => r[0] ?? null)
    return { success: true, message: 'ok', data: sub }
  }, {
    tags:    ['Customers'],
    summary: 'ดู Subscription ปัจจุบันของลูกค้า',
    detail:  {
      description: '**Role:** ทุกคนที่ login\n\nใช้เช็คว่าลูกค้าได้สิทธิ์ส่งฟรีหรือส่วนลดไหม',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireAuth],
    params: t.Object({ id: t.String({ description: 'Customer UUID' }) }),
  })

  .patch('/:id', async ({ params, body, set }) => {
    const existing = await db.select().from(customers)
      .where(eq(customers.id, params.id)).limit(1).then(r => r[0])
    if (!existing) {
      set.status = 404
      return { success: false, message: 'ไม่พบลูกค้า', data: null }
    }
    const [updated] = await db.update(customers).set(body)
      .where(eq(customers.id, params.id)).returning()
    return { success: true, message: 'แก้ไขข้อมูลสำเร็จ', data: updated }
  }, {
    tags:    ['Customers'],
    summary: 'แก้ไขข้อมูลลูกค้า',
    detail:  {
      description: '**Role:** admin, staff',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireRole(['admin', 'staff'])],
    params: t.Object({ id: t.String({ description: 'Customer UUID' }) }),
    body: t.Object({
      name:    t.Optional(t.String({ description: 'ชื่อลูกค้า' })),
      phone:   t.Optional(t.String({ description: 'เบอร์โทร' })),
      address: t.Optional(t.String({ description: 'ที่อยู่' })),
    }),
  })
