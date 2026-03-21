import Elysia, { t } from 'elysia'
import { eq, and } from 'drizzle-orm'
import { db, driverTasks, orders, users } from '../db'
import { authPlugin, requireRole } from '../middlewares/auth.middleware'

export const logisticsRoutes = new Elysia({ prefix: '/logistics' })
  .use(authPlugin(process.env.JWT_SECRET!))

  // ── GET /logistics/tasks ─────────────────────────────────────────────
  // Admin ดู tasks ทั้งหมด
  .get('/tasks', async () => {
    const result = await db
      .select({
        id:          driverTasks.id,
        taskType:    driverTasks.taskType,
        status:      driverTasks.status,
        assignedAt:  driverTasks.assignedAt,
        completedAt: driverTasks.completedAt,
        notes:       driverTasks.notes,
        // ดึงข้อมูล order ที่เกี่ยวข้องมาด้วย
        orderNumber: orders.orderNumber,
        orderStatus: orders.status,
        // ดึงชื่อ driver
        driverName:  users.name,
      })
      .from(driverTasks)
      .innerJoin(orders, eq(driverTasks.orderId, orders.id))
      .innerJoin(users,  eq(driverTasks.driverId, users.id))

    return { success: true, message: 'ok', data: result }
  }, {
    beforeHandle: [requireRole(['admin', 'staff'])],
  })

  // ── GET /logistics/tasks/my ──────────────────────────────────────────
  // Driver ดู tasks ที่ได้รับมอบหมาย
  .get('/tasks/my', async ({ user, set }) => {
    if (!user) {
      set.status = 401
      return { success: false, message: 'ยังไม่ได้ Login', data: null }
    }

    const myTasks = await db
      .select({
        id:          driverTasks.id,
        taskType:    driverTasks.taskType,
        status:      driverTasks.status,
        assignedAt:  driverTasks.assignedAt,
        notes:       driverTasks.notes,
        orderNumber: orders.orderNumber,
        // ที่อยู่รับ/ส่ง จาก order
        pickupAddress:   orders.pickupAddress,
        deliveryAddress: orders.deliveryAddress,
      })
      .from(driverTasks)
      .innerJoin(orders, eq(driverTasks.orderId, orders.id))
      .where(and(
        eq(driverTasks.driverId, user.id),
        // แสดงแค่ที่ยังไม่เสร็จ
        eq(driverTasks.status, 'assigned')
      ))

    return { success: true, message: 'ok', data: myTasks }
  }, {
    beforeHandle: [requireRole(['driver'])],
  })

  // ── POST /logistics/tasks ────────────────────────────────────────────
  // Admin มอบหมายงานให้ Driver
  .post('/tasks', async ({ body, set }) => {
    // ตรวจว่า order มีอยู่จริงก่อน
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, body.orderId))
      .limit(1)
      .then(r => r[0])

    if (!order) {
      set.status = 404
      return { success: false, message: 'ไม่พบ Order', data: null }
    }

    // ตรวจว่า driver มีอยู่และเป็น role driver
    const driver = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, body.driverId),
        eq(users.role, 'driver')
      ))
      .limit(1)
      .then(r => r[0])

    if (!driver) {
      set.status = 404
      return { success: false, message: 'ไม่พบ Driver', data: null }
    }

    const [task] = await db
      .insert(driverTasks)
      .values({
        orderId:  body.orderId,
        driverId: body.driverId,
        taskType: body.taskType,
        status:   'assigned',
        notes:    body.notes ?? null,
      })
      .returning()

    set.status = 201
    return { success: true, message: 'มอบหมายงานสำเร็จ', data: task }
  }, {
    beforeHandle: [requireRole(['admin', 'staff'])],
    body: t.Object({
      orderId:  t.String(),
      driverId: t.String(),
      taskType: t.Union([t.Literal('pickup'), t.Literal('delivery')]),
      notes:    t.Optional(t.String()),
    }),
  })

  // ── PATCH /logistics/tasks/:id/status ───────────────────────────────
  // Driver อัปเดตสถานะงาน เช่น กดว่า "กำลังเดินทาง" หรือ "ส่งแล้ว"
  .patch('/tasks/:id/status', async ({ params, body, set }) => {
    const task = await db
      .select()
      .from(driverTasks)
      .where(eq(driverTasks.id, params.id))
      .limit(1)
      .then(r => r[0])

    if (!task) {
      set.status = 404
      return { success: false, message: 'ไม่พบ Task', data: null }
    }

    await db
      .update(driverTasks)
      .set({
        status: body.status,
        // ถ้างานเสร็จแล้ว บันทึกเวลาที่เสร็จ
        completedAt: body.status === 'completed' ? new Date() : null,
      })
      .where(eq(driverTasks.id, params.id))

    return { success: true, message: `อัปเดต task เป็น ${body.status}`, data: null }
  }, {
    beforeHandle: [requireRole(['driver', 'admin'])],
    params: t.Object({ id: t.String() }),
    body: t.Object({
      status: t.Union([
        t.Literal('in_progress'),
        t.Literal('completed'),
        t.Literal('cancelled'),
      ]),
    }),
  })
