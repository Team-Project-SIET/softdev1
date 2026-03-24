# NongJames Laundry Shop API Test (Postman)

## 1) วิธี run โปรเจกต์ (API)

1. เปิด terminal ที่โฟลเดอร์
   - `c:\Users\Admin\Desktop\softdevpj1-2\softdev1\nongJames-laundry-shop\nongJames-api`
2. สร้างไฟล์ `.env` จากตัวอย่าง
   - `cp .env.example .env` (หรือสร้างเอง)
3. ใส่ค่า
   - `DATABASE_URL=postgresql://user:pass@localhost:5432/laundry`
   - `JWT_SECRET=xxx`
   - `SCB_API_KEY=xxx`, `LINE_CHANNEL_ACCESS_TOKEN=xxx` ฯลฯ
4. รัน migration
   - `bun run db:migrate`
5. สตาร์ท server
   - `bun run dev`  
   API ปกติรันที่ `http://localhost:3001`

> ถ้า run บน Windows แล้วเจอ policy issue (bun/npx run blocked):
> - ใช้ PowerShell แบบเปิด `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
> - หรือใช้ terminal อื่น (Git Bash)

---

## 2) API ที่ควรลองทดสอบ (Postman)

### 2.1 Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile` (ต้องใส่ Authorization)

### 2.2 Orders
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/status`

### 2.3 Logistics
- `GET /api/logistics/tasks`
- `POST /api/logistics/assign`
- `PATCH /api/logistics/:id/status`

### 2.4 Finance
- `GET /api/finance/dashboard`
- `GET /api/finance/transactions`
- `GET /api/finance/expenses`
- `POST /api/finance/expenses`

### 2.5 Payments
- `POST /api/payments/qr`
- `PATCH /api/payments/:id/confirm`
- `GET /api/payments/order/:orderId`

### 2.6 Notifications
- `POST /api/notifications/status-update`
- `GET /api/notifications/:customerId`

---

## 3) ตัวอย่างทดสอบ Postman แบบละเอียด

### 3.1 POST /api/auth/register
- URL: `http://localhost:3001/api/auth/register`
- Method: `POST`
- Header:
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "email": "test1@example.com",
  "password": "P@ssw0rd123",
  "fullName": "Test User",
  "phone": "0900000000",
  "role": "CUSTOMER"
}
```

### 3.2 POST /api/auth/login
- URL: `http://localhost:3001/api/auth/login`
- Method: `POST`
- Header:
  - `Content-Type: application/json`
- Body:
```json
{
  "email": "test1@example.com",
  "password": "P@ssw0rd123"
}
```
- Response จะได้ token  เพื่อใช้ในขั้นถัดไป

### 3.3 GET /api/auth/profile (token required)
- URL: `http://localhost:3001/api/auth/profile`
- Method: `GET`
- Header:
  - `Authorization: Bearer <JWT_TOKEN>`

---

## 4) Example Order Flow

### 4.1 POST /api/orders
- URL: `http://localhost:3001/api/orders`
- Method: `POST`
- Header:
  - `Content-Type: application/json`
  - `Authorization: Bearer <JWT_TOKEN>`
- Body:
```json
{
  "customerId": "<uuid-customer>",
  "orderNumber": "NJ-123456",
  "deliveryType": "PICKUP",
  "status": "PENDING",
  "totalAmount": 500.00,
  "receivedDate": "2026-03-25T10:00:00Z",
  "estimatedReadyDate": "2026-03-27T10:00:00Z",
  "items": [
    { "itemType": "shirt", "quantity": 6, "unitPrice": 20.0 },
    { "itemType": "pants", "quantity": 2, "unitPrice": 40.0 }
  ]
}
```

### 4.2 GET /api/orders
- URL: `http://localhost:3001/api/orders`
- Method: `GET`
- Header: `Authorization: Bearer <JWT_TOKEN>`

### 4.3 PATCH /api/orders/:id/status
- URL: `http://localhost:3001/api/orders/<orderId>/status`
- Method: `PATCH`
- Header:
  - `Content-Type: application/json`
  - `Authorization: Bearer <JWT_TOKEN>`
- Body:
```json
{ "status": "WASHING" }
```

---

## 5) Troubleshooting Common Issues

- `401 Unauthorized`: ตรวจ `JWT_TOKEN`, `JWT_SECRET`, role หรือ middleware auth
- `500 Internal Server Error`: ดู console log ของ backend
- `DB connection fail`: ตรวจ `DATABASE_URL`, ฐานข้อมูล, migration

---

## 6) Tips for Postman

- สร้าง env variable:
  - `base_url=http://localhost:3001`
  - `token=<JWT_TOKEN>`
- ใช้ `{{base_url}}`/`{{token}}` ใน headers
- ใน `Pre-request Script` ของ collection: ใส่ login auto ถ้าต้องการ


## 7) API ชุดเพิ่ม (ถ้ามี)
- ยังมี routes เพิ่มจาก module ต่าง ๆ เช่น `customers`, `services`, `contracts` สามารถดูจาก `src/routes` ใน `nongJames-api/src/routes`
