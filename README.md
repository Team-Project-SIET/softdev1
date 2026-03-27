# nongJames Laundry Shop

## 1. บทนำ
nongJames Laundry Shop เป็นระบบจัดการบริการซัก-อบ-รีด สำหรับลูกค้าและร้านค้า มีโมดูลจัดการคำสั่งซื้อ การชำระเงิน การแจ้งเตือน และการจัดส่ง

## 2. รายละเอียดโครงงาน
### 2.1 ทีมงาน และบทบาท
- Product Owner: อรัญชัย คำเพ็ญ
- UX/UI Designer: นายสรวิชญ์ สมตน,นายวันชนะ ไชยลังกา,นายอนาวิล บุญช่วย
- Frontend Developer: นายอนาวิล บุญช่วย
- Backend Developer: นายวรปรัชญ์ บุญมี,นายอรัญชัย คำเพ็ญ
- QA/Test Engineer: นางสาวชญานิศ ธีรเวโรจน์
### 2.2 SRS และการพัฒนา
- SRS อยู่ใน `documents/PM.XX/PM.00/SRS-laundry-shop/SRS-001.md`, `SRS-002.md`, `SRSoriginal.md`
- วางสเปค requirement ฟังก์ชันการทำงาน, ข้อมูล, user flow, non-functional requirements

### 2.3 ผลการออกแบบ
1. System Architecture
   - รายการ: Frontend: VUE + Backend: Node.js + Database: SQLite
   - บริการรองรับ: auth, customers, orders, payments, logistics, finance, notifications, services
2. Use Case Diagram
   - ผู้ใช้: Customer, Admin, Delivery
   - กรณีใช้งาน: สั่งซัก, ติดตามสถานะ, จ่ายเงิน, ประเมิน
3. Activity Diagram
   - กิจกรรมหลัก: เลือกบริการ → สร้างคำสั่งซื้อ → ชำระเงิน → ส่งงาน → ยืนยันรับ
4. ER Diagram / FR Diagram
   - ตารางหลัก: users, customers, services, orders, payments, logistics, finances, notifications
5. UX/UI
   - navbar, hero, services, pricing, testimonials, checkout, จัดการ order dashboard
`

### 2.4 Tech Stack
- Frontend: VUE
- Backend: Node.js
- Database: SQLite
### 2.5 Test Case และ API Testing
- Test case example:
  - สร้าง account ใหม่, login, สร้าง order, จ่ายเงิน, อัปเดตสถานะ
  - กรณีทดสอบ edge: ค่าบริการไม่พอ, token หมดอายุ
- API Testing:
  - `POST /auth/login`, `GET /orders`, `POST /orders`, `POST /payments`

## 3. การใช้งานเบื้องต้น
1. ติดตั้ง dependencies ทั้ง `nongJames-api` และ root
2. ตั้งค่า `.env` ให้ครบ
3. `npm run dev` (frontend) และ `npm run dev` (backend)
4. เปิด `http://localhost:3000`

## 4. ลิงก์โฟลเดอร์สำคัญ
- `nongJames-laundry-shop` (frontend + backend)
- `nongJames-api/src/routes` (API endpoints)
- `documents/PM.XX` (เอกสาร PM/SRS)
