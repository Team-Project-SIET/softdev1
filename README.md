# NongJames Laundry Shop

## 1. บทนำ
NongJames Laundry Shop เป็นระบบจัดการบริการซัก-อบ-รีด สำหรับลูกค้าและร้านค้า มีโมดูลจัดการคำสั่งซื้อ การชำระเงิน การแจ้งเตือน และการจัดส่ง

## 2. รายละเอียดโครงงาน
### 2.1 ทีมงาน และบทบาท
- Product Owner: วางวิสัยทัศน์และกำหนด Requirement
- UX/UI Designer: ออกแบบหน้าเว็บและประสบการณ์ผู้ใช้
- Frontend Developer: พัฒนาหน้าเว็บ React/Next.js
- Backend Developer: พัฒนาระบบ API, ฐานข้อมูล และ Authentication
- QA/Test Engineer: วางแผน Test case, API Testing และตรวจสอบคุณภาพ

### 2.2 SRS และการพัฒนา
- SRS บรรจุใน `documents/PM.XX/PM.00/SRS-laundry-shop/SRS-001.md`, `SRS-002.md`, `SRSoriginal.md`
- วางสเปค requirement ฟังก์ชันการทำงาน, ข้อมูล, user flow, non-functional requirements

### 2.3 ผลการออกแบบ
1. System Architecture
   - รายการ: Next.js frontend + Node.js/Express backend + PostgreSQL
   - บริการรองรับ: auth, customers, orders, payments, logistics, finance, notifications, services
2. Use Case Diagram
   - ผู้ใช้: Customer, Admin, Delivery
   - กรณีใช้งาน: สั่งซัก, ติดตามสถานะ, จ่ายเงิน, ประเมิน
3. Activity Diagram
   - กิจกรรมหลัก: เลือกบริการ → สร้างคำสั่งซื้อ → ชำระเงิน → ส่งงาน → ยืนยันรับ
4. ER Diagram / FR Diagram
   - ตารางหลัก: users, customers, services, orders, payments, logistics, finances, notifications
5. User Flow (ถ้ามี)
   - เข้าเว็บ → เข้าสู่ระบบ/สมัคร → เลือกบริการ → สร้างคำสั่งซื้อ → จ่ายเงิน → ติดตาม
6. UX/UI
   - navbar, hero, services, pricing, testimonials, checkout, จัดการ order dashboard
7. API Endpoint (ถ้ามี)
   - เอกสาร route ใน `nongJames-api/src/routes/*.route.ts`

### 2.4 Tech Stack
- Frontend: Next.js, TypeScript, CSS Modules
- Backend: Node.js, TypeScript, Express, Drizzle ORM
- Database: PostgreSQL
- Auth: JWT
- Tools:
  - Docker Compose
  - ESLint และ Prettier
  - GitHub Copilot (ช่วยโค้ด)

### 2.5 Test Case และ API Testing
- Test case example:
  - สร้าง account ใหม่, login, สร้าง order, จ่ายเงิน, อัปเดตสถานะ
  - กรณีทดสอบ edge: ค่าบริการไม่พอ, token หมดอายุ
- API Testing:
  - `POST /auth/login`, `GET /orders`, `POST /orders`, `POST /payments`

### 2.6 การ Deploy (ถ้ามี)
- ใช้ `docker-compose up -d` เพื่อรันฐานข้อมูลและแอป
- frontend: build ด้วย `npm run build` แล้ว deploy ขึ้น Vercel
- backend: build และ deploy บน server หรือ Cloud (e.g., Render)

## 3. การใช้งานเบื้องต้น
1. ติดตั้ง dependencies ทั้ง `nongJames-api` และ root
2. ตั้งค่า `.env` ให้ครบ
3. `npm run dev` (frontend) และ `npm run dev` (backend)
4. เปิด `http://localhost:3000`

## 4. ลิงก์โฟลเดอร์สำคัญ
- `nongJames-laundry-shop` (frontend + backend)
- `nongJames-api/src/routes` (API endpoints)
- `documents/PM.XX` (เอกสาร PM/SRS)
