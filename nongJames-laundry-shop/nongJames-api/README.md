# NongJames Laundry Management API

🚀 ระบบจัดการร้านซักอบรีดแบบ B2C & B2B พร้อม ORDER WORKFLOW, LOGISTICS, FINANCE ส่วนรวม SCB & LINE Integration

**สถานะ**: ✅ Backend หลักทำงานได้ | 🟢 พร้อมทดสอบ

---

## 📋 เริ่มต้นอย่างรวดเร็ว

### ข้อกำหนดเบื้องต้น
- Bun หรือ Node.js ติดตั้งแล้ว
- PostgreSQL Database ทำงานอยู่
- ไฟล์ `.env` ตั้งค่าเรียบร้อย (ดู Environment Variables)

### การติดตั้งและการรัน

```bash
# 1. ติดตั้ง dependencies
bun install
# หรือ: npm install

# 2. ตั้งค่า database (ครั้งแรก)
bun run drizzle-kit push:pg

# 3. เริ่มต้น Development Server
bun run dev
# Server: http://localhost:3000
# API Docs: http://localhost:3000/docs
# Health: http://localhost:3000/health

# หรือ Production:
bun run start
```

---

## 🏛️ ภาพรวมสถาปัตยกรรม

### Stack เทคโนโลยี
- **Runtime**: Bun (เร็ว) + Node.js compatible
- **Framework**: Elysia (TypeScript HTTP API framework)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (Bearer tokens) + bcryptjs (password hashing)
- **Integrations**: SCB Payment API, LINE Messaging API

### โครงสร้างโปรเจกต์
```
src/
├── app.ts                 # โครงสร้าง application หลัก
├── db.ts                  # ตั้งค่าฐานข้อมูล
├── index.ts               # จุดเริ่มต้นของโปรแกรม
├── modules/               # Module ของแต่ละฟีเจอร์
│   ├── auth/              # ระบบ Authentication ✅
│   ├── orders/            # จัดการคำสั่งซื้อ ⚠️
│   ├── logistics/         # คนขับและการจัดส่ง 🔴
│   ├── finance/           # การชำระเงินและการเงิน 🔴
│   └── notifications/     # การแจ้งเตือน 🔴
├── db/schema/             # Schema ฐานข้อมูล ✅
├── middlewares/           # Auth Middleware ✅
├── integrations/          # API ภายนอก
│   ├── scb/               # SCB Payment 🔴
│   └── line/              # LINE Messaging 🔴
├── common/                # Utilities ร่วมกัน ✅
└── routes/                # Route Handlers
```

**สัญลักษณ์สถานะ**: ✅ เสร็จสมบูรณ์ | ⚠️ รอการทดสอบ | 🔴 รอการพัฒนา

---

## 🔐 Endpoint API & Authentication

### กระบวนการ Authentication
```
1. สมัครสมาชิก → POST /api/auth/register
   ↓
2. เข้าสู่ระบบ → POST /api/auth/login (รับ JWT tokens)
   ↓
3. ใช้ Authorization: Bearer <accessToken>
   ↓
4. เข้าใช้ Endpoint ที่ปิดกั้น
   ↓
5. Refresh → POST /api/auth/refresh (รับ Token ใหม่)
```

### Endpoint หลัก

#### Module Auth (`/api/auth`)
```
POST   /api/auth/register      - สมัครสมาชิกใหม่
POST   /api/auth/login         - เข้าสู่ระบบและรับ JWT
POST   /api/auth/refresh       - Refresh Access Token
POST   /api/auth/logout        - ออกจากระบบ
GET    /api/auth/profile       - ดึงข้อมูลโปรไฟล์ (ต้อง auth)
```

#### Module Orders (`/api/orders`)
```
POST   /api/orders             - สร้างคำสั่งซื้อ (Admin/Staff)
GET    /api/orders             - แสดงรายการคำสั่งซื้อ (มี pagination)
GET    /api/orders/:id         - ดึงรายละเอียดคำสั่งซื้อ
PATCH  /api/orders/:id         - แก้ไขคำสั่งซื้อ
DELETE /api/orders/:id         - ยกเลิกคำสั่งซื้อ
POST   /api/orders/:id/status  - อัปเดตสถานะคำสั่งซื้อ (workflow)
```

#### Module Logistics (`/api/logistics`)
```
POST   /api/logistics/drivers                          - สร้างคนขับ
GET    /api/logistics/drivers                          - แสดงรายการคนขับ
GET    /api/logistics/drivers/:driverId                - ดึงข้อมูลคนขับ
POST   /api/logistics/assignments                      - มอบหมายคำสั่งซื้อให้คนขับ
GET    /api/logistics/drivers/:driverId/assignments   - ดึงงานของคนขับ
PATCH  /api/logistics/tasks/:id/status                - อัปเดตสถานะงาน
GET    /api/logistics/orders/:orderId/status          - ติดตามการจัดส่ง
POST   /api/logistics/drivers/:driverId/location      - อัปเดตตำแหน่งคนขับ
```

#### Module Finance (`/api/finance`)
```
POST   /api/finance/payments                   - สร้างการชำระเงิน
GET    /api/finance/payments/:id               - ดึงรายละเอียดการชำระเงิน
POST   /api/finance/scb/initiate               - เริ่มการชำระเงิน SCB
POST   /api/finance/scb/callback               - SCB webhook (อัตโนมัติ)
GET    /api/finance/transactions               - แสดงรายการธุรกรรม
POST   /api/finance/expenses                   - สร้างรายการค่าใช้จ่าย
```

### Health & Info
```
GET    /health                 - ตรวจสอบสถานะ
GET    /api/info               - ข้อมูล API
GET    /api/version            - เวอร์ชัน API
```

### รูปแบบการตอบสนอง (Response)
```json
{
  "success": true/false,
  "message": "ข้อความอ่านง่าย",
  "data": {},
  "timestamp": "2026-03-25T..."
}
```

---

## 🗄️ Schema ฐานข้อมูล

### ตารางหลัก

| ตารางข้อมูล | วัตถุประสงค์ | สถานะ |
|-------|---------|--------|
| `users` | บัญชีผู้ใช้งาน (ทุก Role) | ✅ |
| `customers` | โปรไฟล์ลูกค้า | ✅ |
| `orders` | บันทึกคำสั่งซื้อ | ✅ |
| `orderItems` | รายการสินค้าต่อคำสั่งซื้อ | ✅ |
| `orderWorkflowHistory` | ประวัติการเปลี่ยนสถานะคำสั่งซื้อ | ✅ |
| `payments` | บันทึกการชำระเงิน | ✅ |
| `transactions` | ธุรกรรมการเงิน | ✅ |
| `expenses` | บันทึกค่าใช้จ่าย | ✅ |
| `driverTasks` | การมอบหมายงานให้คนขับ | ✅ |
| `logistics` | การติดตามการจัดส่ง | ✅ |

### บทบาทผู้ใช้งาน (User Roles)
- `ADMIN` - เข้าใช้งานระบบแบบเต็มที่
- `STAFF` - สร้างคำสั่งซื้อ จัดการ Logistics
- `DRIVER` - ดูงานที่ได้รับมอบหมาย อัปเดตตำแหน่งที่อยู่
- `CUSTOMER` - สร้างคำสั่งซื้อ ดูคำสั่งซื้อของตนเอง
- `EXECUTIVE` - รายงานการเงินและวิเคราะห์

---

## 🔑 ตัวแปร Environment

สร้างไฟล์ `.env` ในโฟลเดอร์ root:
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/laundry

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Server
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*

# SCB Payment API
SCB_API_KEY=your-scb-key
SCB_API_SECRET=your-scb-secret
SCB_MERCHANT_ID=your-merchant-id
SCB_CALLBACK_URL=https://yourdomain.com/api/finance/scb/callback

# LINE Messaging API
LINE_CHANNEL_ID=your-channel-id
LINE_CHANNEL_SECRET=your-channel-secret
LINE_ACCESS_TOKEN=your-access-token
```

---

## 📝 การทดสอบ

### ใช้ cURL
```bash
# ตรวจสอบสถานะ
curl http://localhost:3000/health

# สมัครสมาชิก
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "user@example.com",
    "password": "secure123",
    "role": "CUSTOMER"
  }'

# เข้าสู่ระบบ
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure123"
  }'
```

### ใช้ Postman
ดู [POSTMAN_TESTING_GUIDE.md](./POSTMAN_TESTING_GUIDE.md) สำหรับคำแนะนำการทดสอบแบบละเอียดและ Collection ต่างๆ

---

## ✅ งานที่เสร็จสมบูรณ์

### การพัฒนาหลัก
- ✅ ระบบ Authentication (password hashing, JWT tokens)
- ✅ โครงสร้าง API Route ด้วย `/api` prefix
- ✅ Role-Based Access Control (RBAC) ด้วย uppercase roles
- ✅ Schema ฐานข้อมูลโดยใช้ Drizzle ORM
- ✅ Error Handling Middleware
- ✅ Request Logging
- ✅ ตั้งค่า Environment

### การทดสอบและเอกสาร
- ✅ คู่มือการทดสอบ Postman
- ✅ เอกสาร Endpoint API
- ✅ ไฟล์ TypeScript ทั้งหมดโปรแกรมได้สำเร็จโดยไม่มีข้อผิดพลาด
- ✅ Backend ทำงานได้สำเร็จบน localhost:3000

---

## 🔴 TODO - รายการสำคัญ (High Priority)

### ตั้งค่าฐานข้อมูล
```bash
# สร้าง Migration
bun run drizzle-kit push:pg

# ตรวจสอบตารางที่สร้าง
bun run drizzle-kit studio
```

### การพัฒนา Controller
- [ ] เสร็จสิ้นการทำ Orders Controller
- [ ] เสร็จสิ้นการทำ Logistics Controller
- [ ] เสร็จสิ้นการทำ Finance Controller
- [ ] เสร็จสิ้นการทำ Notifications Controller

### เสร็จสิ้นการ Integration
- [ ] SCB Payment API Integration
- [ ] LINE Messaging API Integration
- [ ] Webhook Handlers สำหรับ SCB & LINE

### การทดสอบ
- [ ] Unit Tests สำหรับ Services
- [ ] Integration Tests สำหรับ Endpoints
- [ ] End-to-End Workflow Tests

---

## 🟡 TODO - รายการที่สำคัญ (Medium Priority)

- [ ] Request Validation Middleware
- [ ] Structured Logging
- [ ] Error Tracking (Sentry)
- [ ] Rate Limiting
- [ ] Input Sanitization
- [ ] CSRF Protection

---

## 🔵 TODO - คุณสมบัติเพิ่มเติม (Low Priority)

- [ ] API Versioning
- [ ] Caching Layer
- [ ] Performance Optimization
- [ ] Automated Backups
- [ ] Monitoring Dashboard
- [ ] Advanced Analytics

---

## 📚 ไฟล์เอกสาร

| ไฟล์ | วัตถุประสงค์ | ตำแหน่ง |
|------|---------|----------|
| **README.md** (ไฟล์นี้) | เอกสารหลัก | Root |
| **POSTMAN_TESTING_GUIDE.md** | คู่มือการทดสอบ API | Root |
| **docs/archive/** | เอกสารทางเทคนิคที่เก็บถาวร | docs/ |
| **SRS-002.md** | ข้อกำหนดทางธุรกิจ | documents/SRS-laundry-shop/ |

---

## 🔗 ลิงก์สำคัญ

### ทรัพยากรภายนอก
- **Bun Documentation**: https://bun.sh
- **Elysia Framework**: https://elysia.io/
- **Drizzle ORM**: https://orm.drizzle.team/
- **PostgreSQL**: https://www.postgresql.org/

### API Partners
- **SCB Developer Portal**: https://www.scb-developer.com/
- **LINE Messaging API**: https://developers.line.biz/en/

### Project Docs
- **Business Requirements**: `documents/PM.XX/PM.00/SRS-laundry-shop/SRS-002.md`
- **Technical Guides**: `docs/archive/` (เอกสารที่เก็บถาวร)

---

## 🚨 หมายเหตุเรื่องความปลอดภัยสำคัญ

1. **เปลี่ยน JWT_SECRET ในสภาพแวดล้อม Production** - ใช้ Secret ที่แข็งแรงและไม่ซ้ำกัน
2. **ข้อมูลประจำตัวฐานข้อมูล** - ใช้ Environment Variables ห้ามการสุ่ม `.env`
3. **ตั้งค่า CORS** - จำกัดให้เฉพาะ Origins ที่ระบุใน Production
4. **SSL/HTTPS** - ใช้ใน Production (จำเป็นสำหรับ Payment APIs)
5. **API Keys** - เก็บข้อมูลประจำตัว SCB และ LINE ไว้อย่างปลอดภัย

---

## 🆘 แก้ไขปัญหา

### ข้อผิดพลาด Cannot find module
- รัน `bun install` หรือ `npm install`
- ตรวจสอบว่า Import Paths ใช้เส้นทางที่ถูกต้อง

### Database Connection Refused
- ตรวจสอบ PostgreSQL ทำงานอยู่: `psql`
- ตรวจสอบ DATABASE_URL ใน `.env`
- ตรวจสอบฐานข้อมูลมีอยู่: `psql -l`

### Port 3000 ถูกใช้งานแล้ว
```bash
# ปิด Process ที่ใช้ Port 3000
lsof -ti :3000 | xargs kill -9
# หรือ
netstat -ano | findstr :3000
```

### JWT Token หมดอายุ
- Token หมดอายุหลังจาก 7 วัน
- ใช้ Endpoint `/api/auth/refresh` เพื่อรับ Token ใหม่
- ดู POSTMAN_TESTING_GUIDE.md สำหรับกระบวนการ Refresh

---

## 📞 สนับสนุนและการพัฒนา

**สถานะการพัฒนา**: ทำงานอยู่ 🟢

อัปเดตล่าสุด: 25 มีนาคม 2026
เวอร์ชัน: 1.0.0
ความเสถียร API: Beta (ฟีเจอร์หลักทำงานได้ บางโมดูลยังไม่สมบูรณ์)
