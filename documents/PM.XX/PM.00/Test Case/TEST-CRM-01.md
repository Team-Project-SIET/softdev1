# Test Case Template

| | | |
|---|---|---|
| **Test Case ID** | TEST-CRM-01 | **Test Case Description** | จัดการข้อมูลลูกค้าใหม่ (Add Customer) |
| **Created By** | Development Team | **Reviewed By** | QA Team | **Version** | 1.0 |
| **QA Tester's Log** | บันทึกการทดสอบ TEST-CRM-01 V 1.0 | | |

| | | | | |
|---|---|---|---|---|
| **Tester's Name** | QA Team | **Date Tested** | 25-Mar-2026 | **Test Case (Pass/Fail/Not Executed)** | Not Executed |

## Prerequisites (ข้อกำหนดเบื้องต้น)

| S # | Prerequisites |
|---|---|
| 1 | Admin ได้เข้าสู่ระบบ (Login) สำเร็จแล้ว |
| 2 | มีสิทธิ์ในการจัดการข้อมูลลูกค้า |
| 3 | ฐานข้อมูล Customers ของระบบพร้อมใช้งาน |

## Test Data

| S # | Test Data |
|---|---|
| 1 | ชื่อลูกค้า: นาย สมชาย จันทร์สุขวัฒน์ |
| 2 | เบอร์โทรศัพท์: 0812345678 |
| 3 | อีเมล: somchai@example.com, Line ID: @somchai123 |
| 4 | ที่อยู่: 123 ซอยลาดพร้าว กรุงเทพฯ |
| 5 | ประเภทลูกค้า: ทั่วไป (General) |

## Test Scenario

**เสนอเรื่อง:** Admin สามารถเพิ่มข้อมูลลูกค้าใหม่ลงระบบได้ โดยระบบจะสร้าง Customer ID อัตโนมัติ และเก็บข้อมูลส่วนผู้ติดต่อ ที่อยู่อย่างถูกต้อง

### Test Steps

| Step # | Step Details | Expected Results | Actual Results | Pass / Fail / Not Executed / Suspended |
|---|---|---|---|---|
| 1 | Admin คลิกเมนู "จัดการลูกค้า" (Customer Management) | ระบบแสดงหน้าจอ Customer Management และมีปุ่ม "เพิ่มลูกค้าใหม่" (Add New Customer) | Not executed | Not executed |
| 2 | Admin กรอกข้อมูลลูกค้า: ชื่อ, เบอร์โทร, อีเมล, Line ID, ที่อยู่ | ฟอร์มแสดงช่องข้อมูลทั้งหมดและสามารถกรอกได้ | Not executed | Not executed |
| 3 | Admin เลือกประเภทลูกค้า "ทั่วไป" | ระบบแสดงให้เลือก Dropdown: ทั่วไป/สมาชิก/องค์กร | Not executed | Not executed |
| 4 | Admin คลิกปุ่ม "บันทึก" (Save) | ระบบสร้าง Customer ID อัตโนมัติ (เช่น CUST-2026-001) บันทึกข้อมูลลงฐานข้อมูล และแสดงข้อความ "บันทึกสำเร็จ" | Not executed | Not executed |
| 5 | Admin ค้นหาลูกค้า "สมชาย" | ลูกค้าที่เพิ่งสร้างปรากฏในรายการค้นหา พร้อมแสดง Customer ID, ชื่อ, เบอร์โทร | Not executed | Not executed |

---

## Test Case Notes

- **Module Under Test:** Customer Management (CRM Module)
- **API Endpoints:** POST `/customers` (Create), GET `/customers` (List), GET `/customers/{customerId}` (Detail)
- **Database Tables:** `customers`, `customer_contact_info`
- **Status:** Ready for Testing

## Test Result Summary

| Total Steps | Passed | Failed | Not Executed |
|---|---|---|---|
| 5 | 0 | 0 | 5 |
