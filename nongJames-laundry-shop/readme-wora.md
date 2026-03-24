# NongJames Laundry Shop Management System

ระบบบริหารจัดการร้านรับซักรีดเสื้อผ้าครบวงจร รองรับลูกค้าทั่วไป (B2C) และลูกค้าองค์กร (B2B)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ หรือ Bun
- PostgreSQL 14+
- Docker & Docker Compose (optional)

### Installation
```bash
# Clone project
git clone <repository-url>
cd nongJames-laundry-shop

# Install dependencies
cd nongJames-api && bun install
cd ../src && npm install

# Setup environment
cp .env.example .env
# แก้ไข DATABASE_URL, JWT_SECRET, SCB_API_KEY, LINE_TOKEN

# Database setup
cd ../nongJames-api
bun run db:migrate
bun run db:generate

# Start development
bun run dev  # API on port 3001
# Frontend: cd ../src && npm run dev  # on port 3000
```

### Docker
```bash
docker-compose up -d
```

## 🛠 Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** ElysiaJS, Bun runtime, TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **Authentication:** JWT + LINE OA Login
- **Payment:** SCB Developer API (Sandbox)
- **Deployment:** Docker, Docker Compose

## 📊 Database Schema

### Core Tables

#### Users (ลูกค้า/พนักงาน/คนขับ)
```sql
users (
  id UUID PK,
  email VARCHAR unique,
  password VARCHAR,
  fullName VARCHAR,
  phone VARCHAR,
  role ENUM: ADMIN, STAFF, DRIVER, CUSTOMER,
  lineUserId VARCHAR, -- LINE OA integration
  membershipLevel ENUM: STANDARD, VIP,
  loyaltyPoints INTEGER,
  licenseNumber VARCHAR -- Driver only
)
```

#### Orders (คำสั่งซัก)
```sql
orders (
  id UUID PK,
  orderNumber VARCHAR unique,
  customerId UUID FK → users,
  driverId UUID FK → users,
  status ENUM: PENDING, WASHING, PACKING, READY, COMPLETED,
  deliveryType ENUM: WALK_IN, PICKUP, DELIVERY,
  totalAmount NUMERIC,
  receivedDate TIMESTAMP,
  estimatedReadyDate TIMESTAMP
)

order_items (
  id UUID PK,
  orderId UUID FK → orders,
  itemType VARCHAR,
  quantity INTEGER,
  unitPrice NUMERIC,
  totalPrice NUMERIC
)
```

#### Payments (การชำระเงิน)
```sql
payments (
  id UUID PK,
  orderId UUID FK → orders,
  amount NUMERIC,
  method ENUM: SCB_QR, CASH, BANK_TRANSFER,
  status ENUM: PENDING, COMPLETED, FAILED,
  transactionId VARCHAR,
  qrCode TEXT,
  paidAt TIMESTAMP
)
```

#### Logistics (การขนส่ง)
```sql
driver_tasks (
  id UUID PK,
  orderId UUID FK → orders,
  driverId UUID FK → users,
  status ENUM: ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED,
  deliveryAddress TEXT,
  deliveryLatitude NUMERIC,
  deliveryLongitude NUMERIC
)
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - เข้าสู่ระบบ
- `GET /api/auth/profile` - ดูข้อมูลส่วนตัว

### Orders
- `GET /api/orders` - ดูรายการคำสั่งซื้อทั้งหมด
- `POST /api/orders` - สร้างคำสั่งซื้อใหม่
- `GET /api/orders/:id` - ดูรายละเอียดคำสั่งซื้อ
- `PATCH /api/orders/:id/status` - อัปเดตสถานะ

### Logistics
- `GET /api/logistics/tasks` - ดูงานของคนขับ
- `POST /api/logistics/assign` - มอบหมายงานให้คนขับ
- `PATCH /api/logistics/:id/status` - อัปเดตสถานะการส่ง

### Finance
- `GET /api/finance/dashboard` - ดูภาพรวมการเงิน
- `GET /api/finance/transactions` - ดูธุรกรรมจาก SCB
- `GET /api/finance/expenses` - ดูรายจ่าย
- `POST /api/finance/expenses` - เพิ่มรายจ่าย

### Payments
- `POST /api/payments/qr` - สร้าง QR ชำระเงิน SCB
- `PATCH /api/payments/:id/confirm` - ยืนยันการชำระเงิน
- `GET /api/payments/order/:orderId` - ดูการชำระเงินของคำสั่งซื้อ

### Notifications
- `POST /api/notifications/status-update` - ส่งแจ้งเตือนสถานะ
- `GET /api/notifications/:customerId` - ดูแจ้งเตือนของลูกค้า

## 💻 Development

### Code Examples

#### สร้างคำสั่งซื้อใหม่
```typescript
const newOrder = await db.insert(orders).values({
  orderNumber: `NJ-${Date.now()}`,
  customerId: userId,
  totalAmount: 150.00,
  status: 'PENDING',
  receivedDate: new Date(),
  estimatedReadyDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
}).returning();
```

#### อัปเดตสถานะคำสั่งซื้อ
```typescript
await db.transaction(async (tx) => {
  await tx.update(orders)
    .set({ status: 'WASHING', updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  await tx.insert(orderWorkflowHistory).values({
    orderId,
    fromStatus: 'PENDING',
    toStatus: 'WASHING',
    changedBy: userId,
    changedAt: new Date()
  });
});
```

#### สร้าง QR ชำระเงิน SCB
```typescript
const qrResponse = await fetch('https://api-sandbox.partners.scb/partners/sandbox/v1/payment/qrcode/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'authorization': `Bearer ${scbToken}`,
    'resourceOwnerId': process.env.SCB_API_KEY
  },
  body: JSON.stringify({
    qrType: 'PP',
    ppType: 'BILLERID',
    ppId: process.env.SCB_BILLER_ID,
    amount: amount.toString(),
    ref1: paymentId,
    ref2: orderId
  })
});
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/laundry_db

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# SCB Payment API
SCB_API_KEY=your-scb-api-key
SCB_API_SECRET=your-scb-api-secret
SCB_BILLER_ID=your-biller-id

# LINE OA
LINE_CHANNEL_ACCESS_TOKEN=your-line-access-token
LINE_CHANNEL_SECRET=your-line-secret
```

## 🚀 Deployment

### Production Build
```bash
bun run build
bun run start
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🐛 Troubleshooting

### Database Connection
```bash
# Check PostgreSQL
psql -h localhost -U postgres -d laundry_db

# Reset database
bun run db:reset
```

### SCB API Issues
- ตรวจสอบ API credentials ใน SCB Developer Console
- ใช้ Sandbox environment สำหรับ testing
- ตรวจสอบ request payload format

### LINE Integration
- ตรวจสอบ Channel Access Token
- ตรวจสอบ LINE OA configuration
- ตรวจสอบ user ได้ link LINE account แล้ว

## 👥 Team

- **Project Manager:** อรัญชัย คำเพ็ญ
- **Backend Developer:** วรปรัชญ์ บุญมี
- **Frontend Developer:** อนาวิล บุญช่วย
- **UI/UX Designer:** สรวิชญ์ สมตน

## 📝 License

MIT License