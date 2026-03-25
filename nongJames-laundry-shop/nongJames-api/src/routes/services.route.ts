import Elysia, { t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db, services } from '../db'
import { authPlugin, requireRole } from '../middlewares/auth.middleware'

export const serviceRoutes = new Elysia({ prefix: '/services' })
  .use(authPlugin(process.env.JWT_SECRET!))

  .get('/', async () => {
    const result = await db.select().from(services).where(eq(services.isActive, true))
    return { success: true, message: 'ok', data: result }
  }, {
    tags:    ['Services'],
    summary: 'ดูบริการที่เปิดใช้งาน (ทุกคนดูได้)',
    detail:  { description: 'ไม่ต้อง auth — ลูกค้าดูราคาก่อนสั่งได้' },
  })

  .get('/all', async () => {
    const result = await db.select().from(services)
    return { success: true, message: 'ok', data: result }
  }, {
    tags:    ['Services'],
    summary: 'ดูบริการทั้งหมด รวม inactive (Admin)',
    detail:  {
      description: '**Role:** admin',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireRole(['admin'])],
  })

  .post('/', async ({ body, set }) => {
    const [newService] = await db.insert(services).values(body).returning()
    set.status = 201
    return { success: true, message: 'เพิ่มบริการสำเร็จ', data: newService }
  }, {
    tags:    ['Services'],
    summary: 'เพิ่มบริการใหม่',
    detail:  {
      description: '**Role:** admin',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireRole(['admin'])],
    body: t.Object({
      name:        t.String({ description: 'ชื่อบริการ เช่น ซักรีดทั่วไป' }),
      description: t.Optional(t.String({ description: 'รายละเอียด' })),
      basePrice:   t.String({ description: 'ราคาต่อหน่วย เช่น 50.00' }),
      unit:        t.Union([
        t.Literal('per_kg'),
        t.Literal('per_piece'),
        t.Literal('per_set'),
      ], { description: 'หน่วย: per_kg=ต่อกิโล, per_piece=ต่อชิ้น, per_set=ต่อชุด' }),
    }),
  })

  .patch('/:id', async ({ params, body, set }) => {
    const existing = await db.select().from(services)
      .where(eq(services.id, params.id)).limit(1).then(r => r[0])
    if (!existing) {
      set.status = 404
      return { success: false, message: 'ไม่พบบริการ', data: null }
    }
    const [updated] = await db.update(services)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(services.id, params.id)).returning()
    return { success: true, message: 'แก้ไขสำเร็จ', data: updated }
  }, {
    tags:    ['Services'],
    summary: 'แก้ไขบริการ',
    detail:  {
      description: '**Role:** admin',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireRole(['admin'])],
    params: t.Object({ id: t.String({ description: 'Service UUID' }) }),
    body: t.Object({
      name:        t.Optional(t.String()),
      description: t.Optional(t.String()),
      basePrice:   t.Optional(t.String()),
      isActive:    t.Optional(t.Boolean({ description: 'true=เปิด, false=ปิด' })),
    }),
  })

  .delete('/:id', async ({ params, set }) => {
    const existing = await db.select().from(services)
      .where(eq(services.id, params.id)).limit(1).then(r => r[0])
    if (!existing) {
      set.status = 404
      return { success: false, message: 'ไม่พบบริการ', data: null }
    }
    await db.update(services).set({ isActive: false })
      .where(eq(services.id, params.id))
    return { success: true, message: 'ปิดบริการแล้ว (soft delete)', data: null }
  }, {
    tags:    ['Services'],
    summary: 'ปิดบริการ (Soft Delete)',
    detail:  {
      description: '**Role:** admin\n\nไม่ลบจริง แค่ปิดการใช้งาน เพราะ orders เก่ายังอ้างอิงอยู่',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireRole(['admin'])],
    params: t.Object({ id: t.String({ description: 'Service UUID' }) }),
  })
