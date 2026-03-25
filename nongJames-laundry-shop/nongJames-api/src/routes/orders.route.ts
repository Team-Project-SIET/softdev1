import Elysia, { t } from 'elysia'
import { eq, desc } from 'drizzle-orm'
import { db, orders, orderItems, orderStatusHistory, customers } from '../db'
import { authPlugin, requireAuth, requireRole } from '../middlewares/auth.middleware'

export const orderRoutes = new Elysia({ prefix: '/orders' })
  .use(authPlugin(process.env.JWT_SECRET!))

  // ── GET /orders ───────────────────────────────────────────────────
  .get('/', async () => {
    const result = await db.select().from(orders).orderBy(desc(orders.createdAt))
    return { success: true, message: 'ok', data: result }
  }, {
    tags:    ['Orders'],
    summary: 'ดูรายการ Orders ทั้งหมด',
    detail:  {
      description: '**Role:** admin, staff เท่านั้น\n\nดูรายการ orders ทุกตัวเรียงจากใหม่ไปเก่า',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireRole(['admin', 'staff'])],
  })

  // ── GET /orders/my ────────────────────────────────────────────────
  .get('/my', async ({ user, set }) => {
    if (!user) return set.status = 401
    const customer = await db.select().from(customers)
      .where(eq(customers.userId, user.id)).limit(1).then(r => r[0])
    if (!customer) {
      set.status = 404
      return { success: false, message: 'ไม่พบข้อมูลลูกค้า', data: null }
    }
    const myOrders = await db.select().from(orders)
      .where(eq(orders.customerId, customer.id))
      .orderBy(desc(orders.createdAt))
    return { success: true, message: 'ok', data: myOrders }
  }, {
    tags:    ['Orders'],
    summary: 'ดู Orders ของตัวเอง (Customer)',
    detail:  {
      description: '**Role:** customer\n\nลูกค้าดู orders ของตัวเองได้',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireAuth],
  })

  // ── GET /orders/:id ───────────────────────────────────────────────
  .get('/:id', async ({ params, set }) => {
    const order = await db.select().from(orders)
      .where(eq(orders.id, params.id)).limit(1).then(r => r[0])
    if (!order) {
      set.status = 404
      return { success: false, message: 'ไม่พบ Order', data: null }
    }
    const items = await db.select().from(orderItems)
      .where(eq(orderItems.orderId, params.id))
    return { success: true, message: 'ok', data: { ...order, items } }
  }, {
    tags:    ['Orders'],
    summary: 'ดู Order รายละเอียด + items',
    detail:  {
      description: '**Role:** ทุกคนที่ login แล้ว\n\nดู order พร้อมรายการสินค้าในนั้น',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireAuth],
    params: t.Object({
      id: t.String({ description: 'Order UUID' }),
    }),
  })

  // ── POST /orders ──────────────────────────────────────────────────
  .post('/', async ({ body, user, set }) => {
    const { customerId, orderType, pickupAddress, deliveryAddress, items } = body
    const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
    const dateStr     = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const seq         = Math.floor(Math.random() * 900 + 100)
    const orderNumber = `NJ-${dateStr}-${seq}`

    const [newOrder] = await db.insert(orders).values({
      orderNumber, customerId, createdBy: user!.id,
      orderType, pickupAddress: pickupAddress ?? null,
      deliveryAddress: deliveryAddress ?? null,
      totalAmount: totalAmount.toString(),
      status: 'pending_pickup', paymentStatus: 'pending',
    }).returning()

    if (items.length > 0) {
      await db.insert(orderItems).values(
        items.map(i => ({
          orderId: newOrder.id, serviceId: i.serviceId,
          quantity: i.quantity.toString(),
          unitPrice: i.unitPrice.toString(),
          subtotal: (i.quantity * i.unitPrice).toString(),
        }))
      )
    }

    await db.insert(orderStatusHistory).values({
      orderId: newOrder.id, changedBy: user!.id,
      status: 'pending_pickup', note: 'Order created',
    })

    set.status = 201
    return { success: true, message: 'สร้าง Order สำเร็จ', data: newOrder }
  }, {
    tags:    ['Orders'],
    summary: 'สร้าง Order ใหม่',
    detail:  {
      description: '**Role:** admin, staff\n\nAdmin/Staff สร้าง order และเพิ่มรายการบริการ',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireRole(['admin', 'staff'])],
    body: t.Object({
      customerId:      t.String({ description: 'UUID ของลูกค้า' }),
      orderType:       t.Union([t.Literal('b2c'), t.Literal('b2b')], {
        description: 'ประเภท order',
      }),
      pickupAddress:   t.Optional(t.String({ description: 'ที่อยู่รับผ้า' })),
      deliveryAddress: t.Optional(t.String({ description: 'ที่อยู่ส่งผ้าคืน' })),
      items: t.Array(t.Object({
        serviceId: t.String({ description: 'UUID ของบริการ' }),
        quantity:  t.Number({ description: 'จำนวน (กก. หรือ ชิ้น)' }),
        unitPrice: t.Number({ description: 'ราคาต่อหน่วย' }),
      }), { description: 'รายการบริการใน order' }),
    }),
  })

  // ── PATCH /orders/:id/status ──────────────────────────────────────
  .patch('/:id/status', async ({ params, body, user }) => {
    await db.update(orders)
      .set({ status: body.status, updatedAt: new Date() })
      .where(eq(orders.id, params.id))
    await db.insert(orderStatusHistory).values({
      orderId: params.id, changedBy: user!.id,
      status: body.status, note: body.note ?? null,
    })
    return { success: true, message: `อัปเดตสถานะเป็น ${body.status}`, data: null }
  }, {
    tags:    ['Orders'],
    summary: 'เปลี่ยนสถานะ Order',
    detail:  {
      description: '**Role:** admin, staff, driver\n\nเปลี่ยนสถานะ order พร้อม log การเปลี่ยน',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireRole(['admin', 'staff', 'driver'])],
    params: t.Object({ id: t.String({ description: 'Order UUID' }) }),
    body: t.Object({
      status: t.Union([
        t.Literal('pending_pickup'),
        t.Literal('washing'),
        t.Literal('packing'),
        t.Literal('ready_for_delivery'),
        t.Literal('completed'),
        t.Literal('cancelled'),
      ], { description: 'สถานะใหม่' }),
      note: t.Optional(t.String({ description: 'หมายเหตุการเปลี่ยนสถานะ' })),
    }),
  })
