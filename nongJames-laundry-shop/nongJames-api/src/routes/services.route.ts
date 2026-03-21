import Elysia, { t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db, services } from '../db'
import { authPlugin, requireRole } from '../middlewares/auth.middleware'

export const serviceRoutes = new Elysia({ prefix: '/services' })
  .use(authPlugin(process.env.JWT_SECRET!))

  // ── GET /services ────────────────────────────────────────────────────
  // ดูบริการทั้งหมด (ทุกคนดูได้ ไม่ต้อง login)
  // เพราะ B2C ต้องเห็นราคาก่อนสั่ง
  .get('/', async () => {
    const result = await db
      .select()
      .from(services)
      // แสดงแค่ที่ active อยู่
      .where(eq(services.isActive, true))

    return { success: true, message: 'ok', data: result }
  })

  // ── GET /services/all ────────────────────────────────────────────────
  // Admin ดูทั้งหมด รวม inactive
  .get('/all', async () => {
    const result = await db.select().from(services)
    return { success: true, message: 'ok', data: result }
  }, {
    beforeHandle: [requireRole(['admin'])],
  })

  // ── POST /services ───────────────────────────────────────────────────
  // Admin เพิ่มบริการใหม่
  .post('/', async ({ body, set }) => {
    const [newService] = await db
      .insert(services)
      .values(body)
      .returning()

    set.status = 201
    return { success: true, message: 'เพิ่มบริการสำเร็จ', data: newService }
  }, {
    beforeHandle: [requireRole(['admin'])],
    body: t.Object({
      name:        t.String(),
      description: t.Optional(t.String()),
      basePrice:   t.String(), // numeric ส่งมาเป็น string
      unit:        t.Union([
        t.Literal('per_kg'),
        t.Literal('per_piece'),
        t.Literal('per_set'),
      ]),
    }),
  })

  // ── PATCH /services/:id ──────────────────────────────────────────────
  // แก้ไขบริการ
  .patch('/:id', async ({ params, body, set }) => {
    const existing = await db
      .select()
      .from(services)
      .where(eq(services.id, params.id))
      .limit(1)
      .then(r => r[0])

    if (!existing) {
      set.status = 404
      return { success: false, message: 'ไม่พบบริการ', data: null }
    }

    const [updated] = await db
      .update(services)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(services.id, params.id))
      .returning()

    return { success: true, message: 'แก้ไขสำเร็จ', data: updated }
  }, {
    beforeHandle: [requireRole(['admin'])],
    params: t.Object({ id: t.String() }),
    body: t.Object({
      name:        t.Optional(t.String()),
      description: t.Optional(t.String()),
      basePrice:   t.Optional(t.String()),
      isActive:    t.Optional(t.Boolean()),
    }),
  })

  // ── DELETE /services/:id ─────────────────────────────────────────────
  // ไม่ลบจริง! แค่ปิดใช้งาน (soft delete)
  // เพราะ order เก่าๆ ยังอ้างอิงอยู่
  .delete('/:id', async ({ params, set }) => {
    const existing = await db
      .select()
      .from(services)
      .where(eq(services.id, params.id))
      .limit(1)
      .then(r => r[0])

    if (!existing) {
      set.status = 404
      return { success: false, message: 'ไม่พบบริการ', data: null }
    }

    await db
      .update(services)
      .set({ isActive: false })
      .where(eq(services.id, params.id))

    return { success: true, message: 'ปิดบริการแล้ว', data: null }
  }, {
    beforeHandle: [requireRole(['admin'])],
    params: t.Object({ id: t.String() }),
  })
