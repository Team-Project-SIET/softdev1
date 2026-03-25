# Test Case Template

| | | |
|---|---|---|
| **Test Case ID** | TEST-PAY-01 | **Test Case Description** | ประมวลผลการชำระเงิน (Process Payment) |
| **Created By** | Development Team | **Reviewed By** | QA Team | **Version** | 1.0 |
| **QA Tester's Log** | บันทึกการทดสอบ TEST-PAY-01 V 1.0 | | |

| | | | | |
|---|---|---|---|---|
| **Tester's Name** | QA Team | **Date Tested** | 25-Mar-2026 | **Test Case (Pass/Fail/Not Executed)** | Not Executed |

## Prerequisites (ข้อกำหนดเบื้องต้น)

| S # | Prerequisites |
|---|---|
| 1 | Admin หรือ Customer ได้เข้าสู่ระบบสำเร็จ |
| 2 | มี Order ที่สร้างแล้ว والจำเป็นต้องชำระเงิน |
| 3 | ระบบเชื่อมต่อกับ SCB API Sandbox สำหรับประมวลการชำระเงิน |
| 4 | Customer มีบัญชีธนาคารที่ลงทะเบียนในระบบ |

## Test Data

| S # | Test Data |
|---|---|
| 1 | Order ID: ORD-2026-001, Total Amount: 750.00 บาท |
| 2 | Customer ID: CUST-001 |
| 3 | Payment Method: Bank Transfer (SCB) |
| 4 | Reference Number: REF-20260325-001 |

## Test Scenario

**เสนอเรื่อง:** ระบบสามารถประมวลผลการชำระเงินของลูกค้าผ่าน SCB API ได้อย่างถูกต้อง และบันทึกรายการชำระในฐานข้อมูลพร้อมสถานะ

### Test Steps

| Step # | Step Details | Expected Results | Actual Results | Pass / Fail / Not Executed / Suspended |
|---|---|---|---|---|
| 1 | Admin/Customer คลิกปุ่ม "ชำระเงิน" (Payment) บน Order | ระบบแสดงหน้าจอสรุปจำนวนเงิน 750.00 บาท และปุ่มเลือกวิธีชำระ | Not executed | Not executed |
| 2 | ลูกค้าเลือกวิธีชำระเงิน "โอนบัญชีธนาคาร" (Bank Transfer) | ระบบแสดงรายละเอียด Bank Account ที่จะรับการโอน และ Reference Number | Not executed | Not executed |
| 3 | ระบบส่งข้อมูลการชำระไปยัง SCB API | SCB API ตอบกลับสถานะ "Pending" หรือ "Success" พร้อม Transaction ID | Not executed | Not executed |
| 4 | ระบบบันทึกรายการการชำระเงินลงฐานข้อมูล | Payment Record ถูกสร้าง พร้อมสถานะ, Reference Number, Transaction ID | Not executed | Not executed |
| 5 | ตรวจสอบข้อมูลการชำระในระบบบัญชีการเงิน | Order สถานะเปลี่ยนเป็น "Paid" และปรากฏในรายการรายรับประจำวัน | Not executed | Not executed |

---

## Test Case Notes

- **Module Under Test:** Payment Processing (Financial Module)
- **API Endpoints:** POST `/payments` (Create), GET `/payments/{paymentId}` (Status), POST `/payments/verify` (SCB Webhook)
- **External API:** SCB Developer API Sandbox
- **Database Tables:** `payments`, `transactions`, `finances`
- **Status:** Ready for Testing

## Test Result Summary

| Total Steps | Passed | Failed | Not Executed |
|---|---|---|---|
| 5 | 0 | 0 | 5 |
