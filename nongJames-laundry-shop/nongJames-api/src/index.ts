import 'dotenv/config'
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

// import routes ทุกตัว
import { authRoutes }         from './routes/auth.route'
import { orderRoutes }        from './routes/orders.route'
// routes อื่นๆ เพิ่มทีหลังได้เลย
// import { customerRoutes }  from './routes/customers.route'
// import { serviceRoutes }   from './routes/services.route'
// import { logisticsRoutes } from './routes/logistics.route'
// import { paymentRoutes }   from './routes/payments.route'
// import { financeRoutes }   from './routes/finance.route'
// import { notiRoutes }      from './routes/notifications.route'

const app = new Elysia()

  // ── CORS ──────────────────────────────────────────────────────────────
  // บอกว่า Origin ไหน (frontend) มีสิทธิ์ยิง request มาได้
  // ถ้าไม่ตั้ง Browser จะ block ทุก request จาก Next.js
  .use(cors({
    origin:      process.env.WEB_URL || 'http://localhost:3000',
    credentials: true, // อนุญาตให้ส่ง cookie/header ข้าม origin
  }))

  // ── Health Check ──────────────────────────────────────────────────────
  // GET /health → เช็คว่า server ยังทำงานอยู่ไหม
  // ใช้ monitor หรือ ping ก็ได้
  .get('/health', () => ({
    success: true,
    message: '🦊 NJ Laundry API is running',
    timestamp: new Date().toISOString(),
  }))

  // ── Register Routes ───────────────────────────────────────────────────
  // .use() = เอา route group มาแขวน
  // แต่ละ route group มี prefix เป็นของตัวเอง เช่น /auth, /orders
  .use(authRoutes)    // /auth/**
  .use(orderRoutes)   // /orders/**

  // ── Start Server ──────────────────────────────────────────────────────
  .listen(process.env.PORT || 8000)

console.log(`🦊 NJ Laundry API → http://localhost:${app.server?.port}`)
console.log(`📋 Routes:`)
console.log(`   GET  /health`)
console.log(`   GET  /auth/me`)
console.log(`   GET  /auth/line`)
console.log(`   GET  /auth/google`)
console.log(`   GET  /orders`)
console.log(`   POST /orders`)
console.log(`   GET  /orders/:id`)
console.log(`   PATCH /orders/:id/status`)
