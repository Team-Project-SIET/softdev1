# Test Case Template

| | | |
|---|---|---|
| **Test Case ID** | TEST-ORD-01 | **Test Case Description** | สร้างคำสั่งซัก (Create Order) ผ่านระบบเว็บ NongJames |
| **Created By** | Development Team | **Reviewed By** | QA Team | **Version** | 1.0 |
| **QA Tester's Log** | บันทึกการทดสอบ TEST-ORD-01 V 1.0 | | |

| | | | | |
|---|---|---|---|---|
| **Tester's Name** | QA Team | **Date Tested** | 25-Mar-2026 | **Test Case (Pass/Fail/Not Executed)** | Not Executed |

## Prerequisites (ข้อกำหนดเบื้องต้น)

| S # | Prerequisites |
|---|---|
| 1 | ผู้ใช้งานได้เข้าสู่ระบบ (Login) สำเร็จแล้ว |
| 2 | มีบัญชีผู้ใช้งาน (Customer Account) ในระบบ NongJames Laundry Shop |
| 3 | หมวดหมู่บริการและราคาของบริการถูกตั้งค่าในระบบแล้ว |

## Test Data

| S # | Test Data |
|---|---|
| 1 | Customer ID: CUST-001, Email: customer@example.com |
| 2 | Service: "Washing & Drying" - ราคา 150 บาท |
| 3 | Quantity: 5 กิโลกรัม |

## Test Scenario

**เสนอเรื่อง:** ผู้ใช้งานสามารถสร้างคำสั่งซัก (Order) และระบบบันทึกข้อมูลได้ถูกต้อง พร้อมสร้าง Order ID ไว้ในฐานข้อมูล

### Test Steps

| Step # | Step Details | Expected Results | Actual Results | Pass / Fail / Not Executed / Suspended |
|---|---|---|---|---|
| 1 | ผู้ใช้งานคลิกปุ่ม "สั่งซัก" (Create Order) ในหน้า Dashboard | ระบบแสดงปัจจัยการประมาณราคา (form สำหรับเลือกบริการ, น้ำหนัก, วันที่) | Not executed | Not executed |
| 2 | เลือกบริการ "Washing & Drying" และกรอก น้ำหนัก 5 กิโลกรัม | ระบบคำนวณราคารวม 150 × 5 = 750 บาท | Not executed | Not executed |
| 3 | กดปุ่ม "ยืนยันการสั่งซัก" (Confirm Order) | ระบบสร้าง Order ID ใหม่ (เช่น ORD-2026-001) บันทึกลงฐานข้อมูล และแสดงหน้ายืนยัน | Not executed | Not executed |
| 4 | ตรวจสอบ Order History | ต้องปรากฏ Order ที่เพิ่งสร้างในรายการ Order History ของผู้ใช้งาน | Not executed | Not executed |

---

## Test Case Notes

- **Module Under Test:** Orders Module
- **API Endpoints:** POST `/orders` (Create Order), GET `/orders/{orderId}` (Get Order Details)
- **Database Tables:** `orders`, `order_items`, `services`
- **Status:** Ready for Testing

## Test Result Summary

| Total Steps | Passed | Failed | Not Executed |
|---|---|---|---|
| 4 | 0 | 0 | 4 |
