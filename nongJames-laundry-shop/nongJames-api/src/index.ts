import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '../.env' })
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ loaded' : '❌ undefined')
console.log('WEB_URL:', process.env.WEB_URL)
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
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  }))
  .use(swagger({
    path: '/swagger',
    documentation: {
      info: {
        title:       '🧺 NJ Laundry API',
        description: 'ระบบบริหารจัดการร้านซักรีด NongJames — Backend API Documentation',
        version:     '1.0.0',
      },
      tags: [
        { name: 'Health',         description: '🟢 เช็คสถานะ API' },
        { name: 'Auth',           description: '🔐 Authentication — LINE / Google OAuth2 + JWT' },
        { name: 'Orders',         description: '📦 จัดการ Orders' },
        { name: 'Customers',      description: '👥 จัดการลูกค้า B2C / B2B' },
        { name: 'Services',       description: '🧺 Catalog บริการซักรีด' },
        { name: 'Logistics',      description: '🚗 มอบหมายงาน Driver' },
        { name: 'Payments',       description: '💳 การชำระเงิน' },
        { name: 'Finance',        description: '💰 Financial Dashboard + SCB API' },
        { name: 'Notifications',  description: '🔔 LINE Push Notification' },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type:         'http',
            scheme:       'bearer',
            bearerFormat: 'JWT',
            description:  'ใส่ JWT token ที่ได้จาก /auth/line หรือ /auth/google',
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
    tags:    ['Health'],
    summary: 'เช็คสถานะ API',
    detail:  { description: 'ใช้ ping ว่า server ยังทำงานอยู่ไหม ไม่ต้อง auth' },
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
