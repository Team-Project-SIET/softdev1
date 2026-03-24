import Elysia, { t } from 'elysia'
import { eq, desc } from 'drizzle-orm'
import { db } from '../db'
import { customers, orders, contracts } from '../db/schema'
import { authPlugin, requireRole, requireAuth } from '../middlewares/auth.middleware'

export const customerRoutes = new Elysia({ prefix: '/customers' })
  .use(authPlugin(process.env.JWT_SECRET!))

  // ── GET /customers ────────────────────────────────────────────────────
  // Admin ดูรายการลูกค้าทั้งหมด
  .get('/', async () => {
    const result = await db
      .select()
      .from(customers)
      .orderBy(desc(customers.createdAt))

    return { success: true, message: 'ok', data: result }
  }, {
    beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
  })

  // ── GET /customers/:id ───────────────────────────────────────────────
  // ดูข้อมูลลูกค้ารายคน
  .get('/:id', async ({ params, set }) => {
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, params.id))
      .limit(1)
      .then(r => r[0])

    if (!customer) {
      set.status = 404
      return { success: false, message: 'ไม่พบลูกค้า', data: null }
    }

    return { success: true, message: 'ok', data: customer }
  }, {
    beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
    params: t.Object({ id: t.String() }),
  })

  // ── GET /customers/:id/orders ────────────────────────────────────────
  // ดู orders ทั้งหมดของลูกค้าคนนั้น
  .get('/:id/orders', async ({ params, set }) => {
    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, params.id))
      .orderBy(desc(orders.createdAt))

    return { success: true, message: 'ok', data: customerOrders }
  }, {
    beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
    params: t.Object({ id: t.String() }),
  })

  // ── GET /customers/:id/contracts ─────────────────────────────────
  // เช็คสัญญา B2B ปัจจุบันของลูกค้า
  // ใช้ตอนสร้าง order เพื่อเช็คว่าส่งฟรีหรือมีส่วนลดไหม
  .get('/:id/contracts', async ({ params }) => {
    const customerContracts = await db
      .select({
        id:              contracts.id,
        status:          contracts.status,
        startDate:       contracts.startDate,
        endDate:         contracts.endDate,
        contractNumber:  contracts.contractNumber,
        discountPercentage: contracts.discountPercentage,
      })
      .from(contracts)
      .where(eq(contracts.clientId, params.id))
      .limit(1)
      .then(r => r[0] ?? null)

    return { success: true, message: 'ok', data: customerContracts }
  }, {
    beforeHandle: [requireAuth],
    params: t.Object({ id: t.String() }),
  })

  // ── PATCH /customers/:id ─────────────────────────────────────────────
  // แก้ไขข้อมูลลูกค้า
  .patch('/:id', async ({ params, body, set }) => {
    const existing = await db
      .select()
      .from(customers)
      .where(eq(customers.id, params.id))
      .limit(1)
      .then(r => r[0])

    if (!existing) {
      set.status = 404
      return { success: false, message: 'ไม่พบลูกค้า', data: null }
    }

    const [updated] = await db
      .update(customers)
      .set(body)
      .where(eq(customers.id, params.id))
      .returning()

    return { success: true, message: 'แก้ไขข้อมูลสำเร็จ', data: updated }
  }, {
    beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
    params: t.Object({ id: t.String() }),
    body: t.Object({
      name:    t.Optional(t.String()),
      phone:   t.Optional(t.String()),
      address: t.Optional(t.String()),
    }),
  })
