import 'dotenv/config'
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'

import { authRoutes }         from './routes/auth.route'
import { orderRoutes }        from './routes/orders.route'
import { customerRoutes }     from './routes/customers.route'
import { serviceRoutes }      from './routes/services.route'
import { logisticsRoutes }    from './routes/logistics.route'
import { paymentRoutes }      from './routes/payments.route'
import { financeRoutes }      from './routes/finance.route'
import { notificationRoutes } from './routes/notifications.route'

const app = new Elysia()
  .use(cors({
    origin:      process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
  }))

  // ── Swagger ───────────────────────────────────────────────────────────
  // เปิด http://localhost:8000/swagger เพื่อดู API docs
  .use(swagger({
    path: '/swagger',
    documentation: {
      info: {
        title:       '🧺 NJ Laundry API',
        description: 'ระบบบริหารจัดการร้านซักรีด NongJames (nongJames-api)',
        version:     '1.0.0',
      },
      // จัดกลุ่ม routes ด้วย tags
      tags: [
        { name: 'Health',        description: 'เช็คสถานะ API' },
        { name: 'Auth',          description: 'Authentication — LINE / Google OAuth2' },
        { name: 'Orders',        description: 'จัดการ Orders' },
        { name: 'Customers',     description: 'จัดการลูกค้า' },
        { name: 'Services',      description: 'จัดการบริการ Catalog' },
        { name: 'Logistics',     description: 'มอบหมายงาน Driver' },
        { name: 'Payments',      description: 'การชำระเงิน' },
        { name: 'Finance',       description: 'การเงิน Dashboard' },
        { name: 'Notifications', description: 'LINE Push Notification' },
      ],
      // ตั้ง Bearer Auth ให้ใส่ JWT token ใน Swagger UI ได้เลย
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  }))

  .get('/health', () => ({
    success:   true,
    message:   '🦊 NJ Laundry API is running',
    timestamp: new Date().toISOString(),
  }), {
    // บอก Swagger ว่า route นี้อยู่ใน tag ไหน
    tags: ['Health'],
  })

  .use(authRoutes)
  .use(orderRoutes)
  .use(customerRoutes)
  .use(serviceRoutes)
  .use(logisticsRoutes)
  .use(paymentRoutes)
  .use(financeRoutes)
  .use(notificationRoutes)
  .listen(process.env.PORT || 8000)

console.log(`🦊 NJ Laundry API  → http://localhost:${app.server?.port}`)
console.log(`📖 Swagger Docs    → http://localhost:${app.server?.port}/swagger`)
