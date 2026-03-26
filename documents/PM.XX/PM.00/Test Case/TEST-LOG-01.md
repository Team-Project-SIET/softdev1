# Test Case Template

| | | |
|---|---|---|
| **Test Case ID** | TEST-LOG-01 | **Test Case Description** | มอบหมายงานให้ Driver และติดตามสถานะ (Assign & Track Delivery) |
| **Created By** | Development Team | **Reviewed By** | QA Team | **Version** | 1.0 |
| **QA Tester's Log** | บันทึกการทดสอบ TEST-LOG-01 V 1.0 | | |

| | | | | |
|---|---|---|---|---|
| **Tester's Name** | QA Team | **Date Tested** | 25-Mar-2026 | **Test Case (Pass/Fail/Not Executed)** | Not Executed |

## Prerequisites (ข้อกำหนดเบื้องต้น)

| S # | Prerequisites |
|---|---|
| 1 | Admin ได้เข้าสู่ระบบสำเร็จ |
| 2 | มี Driver ที่ลงทะเบียนในระบบอย่างน้อย 1 คน |
| 3 | มี Order ที่ได้รับการชำระเงินแล้ว และพร้อมบริการ Pickup/Delivery |
| 4 | Driver มีมือถือและสามารถเข้าถึง Mobile Web ของระบบ |

## Test Data

| S # | Test Data |
|---|---|
| 1 | Order ID: ORD-2026-001, Status: Paid |
| 2 | Driver ID: DRV-001, Driver Name: สมชาติ ขับรถ, Mobile: 0898765432 |
| 3 | Customer Address: 123 ซอยลาดพร้าว กรุงเทพฯ |
| 4 | Delivery Type: Pickup (รับเสื้อผ้า) |

## Test Scenario

**เสนอเรื่อง:** Admin สามารถมอบหมายงาน Pickup/Delivery ให้ Driver ได้ และ Driver สามารถอัปเดตสถานะงานผ่าน Mobile Web ได้อย่างเรียลไทม์

### Test Steps

| Step # | Step Details | Expected Results | Actual Results | Pass / Fail / Not Executed / Suspended |
|---|---|---|---|---|
| 1 | Admin คลิกเมนู "จัดการงาน Logistics" (Logistics Management) | ระบบแสดงรายการ Order ที่ต้องจัดส่ง พร้อมปุ่ม "มอบหมายให้ Driver" | Not executed | Not executed |
| 2 | Admin เลือก Order ORD-2026-001 และคลิก "มอบหมาย" | ระบบแสดง Dialog ให้เลือก Driver จาก Dropdown (DRV-001 - สมชาติ) | Not executed | Not executed |
| 3 | Admin เลือก Driver "DRV-001" และคลิก "ยืนยัน" | ระบบมอบหมายงาน, บันทึกลงฐานข้อมูล, สถานะเปลี่ยนเป็น "Pending Pickup" | Not executed | Not executed |
| 4 | Driver ตรวจสอบรายการงานผ่าน Mobile Web | Driver เห็นรายการงาน ORD-2026-001 พร้อมที่อยู่ลูกค้า เบอร์โทรติดต่อ | Not executed | Not executed |
| 5 | Driver คลิก "รับเสื้อผ้า" (Pickup) หลังจากเก็บเสื้อผ้าแล้ว | ระบบอัปเดตสถานะเป็น "In Transit" และส่ง Notification ให้ Customer | Not executed | Not executed |
| 6 | Driver คลิก "ส่งมอบเสร็จ" (Completed) หลังจากส่งเสื้อผ้า | สถานะเปลี่ยนเป็น "Completed" Admin สามารถติดตามสถานะผ่าน Dashboard | Not executed | Not executed |

---

## Test Case Notes

- **Module Under Test:** Logistics Management (Delivery Tracking)
- **API Endpoints:** POST `/logistics/assign` (Assign Driver), PATCH `/logistics/{taskId}` (Update Status), GET `/logistics/tasks` (Driver View)
- **Mobile Web:** Driver interface สำหรับ update status real-time
- **Database Tables:** `logistics_tasks`, `delivery_routes`, `driver_assignments`
- **Workflow Status:** Pending Pickup → In Transit → Completed
- **Status:** Ready for Testing

## Test Result Summary

| Total Steps | Passed | Failed | Not Executed |
|---|---|---|---|
| 6 | 0 | 0 | 6 |
