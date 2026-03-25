import Elysia, { t } from 'elysia'
import { eq, and } from 'drizzle-orm'
import { db, driverTasks, orders, users } from '../db'
import { authPlugin, requireRole } from '../middlewares/auth.middleware'

export const logisticsRoutes = new Elysia({ prefix: '/logistics' })
  .use(authPlugin(process.env.JWT_SECRET!))

  .get('/tasks', async () => {
    const result = await db.select({
      id: driverTasks.id, taskType: driverTasks.taskType,
      status: driverTasks.status, assignedAt: driverTasks.assignedAt,
      completedAt: driverTasks.completedAt, notes: driverTasks.notes,
      orderNumber: orders.orderNumber, orderStatus: orders.status,
      driverName: users.name,
    })
    .from(driverTasks)
    .innerJoin(orders, eq(driverTasks.orderId, orders.id))
    .innerJoin(users,  eq(driverTasks.driverId, users.id))
    return { success: true, message: 'ok', data: result }
  }, {
    tags:    ['Logistics'],
    summary: 'ดู Tasks ทั้งหมด',
    detail:  {
      description: '**Role:** admin, staff\n\nดู tasks พร้อม order number และชื่อ driver',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireRole(['admin', 'staff'])],
  })

  .get('/tasks/my', async ({ user, set }) => {
    if (!user) return set.status = 401
    const myTasks = await db.select({
      id: driverTasks.id, taskType: driverTasks.taskType,
      status: driverTasks.status, assignedAt: driverTasks.assignedAt,
      notes: driverTasks.notes, orderNumber: orders.orderNumber,
      pickupAddress: orders.pickupAddress,
      deliveryAddress: orders.deliveryAddress,
    })
    .from(driverTasks)
    .innerJoin(orders, eq(driverTasks.orderId, orders.id))
    .where(and(
      eq(driverTasks.driverId, user.id),
      eq(driverTasks.status, 'assigned')
    ))
    return { success: true, message: 'ok', data: myTasks }
  }, {
    tags:    ['Logistics'],
    summary: 'ดู Tasks ของ Driver ตัวเอง',
    detail:  {
      description: '**Role:** driver\n\nดู tasks ที่ยังไม่เสร็จ พร้อมที่อยู่รับ/ส่ง',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireRole(['driver'])],
  })

  .post('/tasks', async ({ body, set }) => {
    const order = await db.select().from(orders)
      .where(eq(orders.id, body.orderId)).limit(1).then(r => r[0])
    if (!order) {
      set.status = 404
      return { success: false, message: 'ไม่พบ Order', data: null }
    }
    const driver = await db.select().from(users)
      .where(and(eq(users.id, body.driverId), eq(users.role, 'driver')))
      .limit(1).then(r => r[0])
    if (!driver) {
      set.status = 404
      return { success: false, message: 'ไม่พบ Driver', data: null }
    }
    const [task] = await db.insert(driverTasks).values({
      orderId: body.orderId, driverId: body.driverId,
      taskType: body.taskType, status: 'assigned',
      notes: body.notes ?? null,
    }).returning()
    set.status = 201
    return { success: true, message: 'มอบหมายงานสำเร็จ', data: task }
  }, {
    tags:    ['Logistics'],
    summary: 'มอบหมายงานให้ Driver',
    detail:  {
      description: '**Role:** admin, staff\n\nสร้าง task ให้ driver รับ/ส่งผ้า',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireRole(['admin', 'staff'])],
    body: t.Object({
      orderId:  t.String({ description: 'Order UUID' }),
      driverId: t.String({ description: 'Driver UUID (role ต้องเป็น driver)' }),
      taskType: t.Union([
        t.Literal('pickup'),
        t.Literal('delivery'),
      ], { description: 'pickup=รับผ้า, delivery=ส่งผ้าคืน' }),
      notes:    t.Optional(t.String({ description: 'หมายเหตุให้ driver' })),
    }),
  })

  .patch('/tasks/:id/status', async ({ params, body }) => {
    await db.update(driverTasks)
      .set({
        status: body.status,
        completedAt: body.status === 'completed' ? new Date() : null,
      })
      .where(eq(driverTasks.id, params.id))
    return { success: true, message: `อัปเดต task เป็น ${body.status}`, data: null }
  }, {
    tags:    ['Logistics'],
    summary: 'Driver อัปเดตสถานะ Task',
    detail:  {
      description: '**Role:** driver, admin\n\nDriver กดอัปเดตขณะปฏิบัติงาน',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireRole(['driver', 'admin'])],
    params: t.Object({ id: t.String({ description: 'Task UUID' }) }),
    body: t.Object({
      status: t.Union([
        t.Literal('in_progress'),
        t.Literal('completed'),
        t.Literal('cancelled'),
      ], { description: 'สถานะใหม่' }),
    }),
  })
