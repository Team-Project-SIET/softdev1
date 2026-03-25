# Test Case Template

| | | |
|---|---|---|
| **Test Case ID** | TEST-ORD-02 | **Test Case Description** | ตรวจสอบสถานะ Order ผ่าน LINE OA และ Web Portal |
| **Created By** | Development Team | **Reviewed By** | QA Team | **Version** | 1.0 |
| **QA Tester's Log** | บันทึกการทดสอบ TEST-ORD-02 V 1.0 | | |

| | | | | |
|---|---|---|---|---|
| **Tester's Name** | QA Team | **Date Tested** | 25-Mar-2026 | **Test Case (Pass/Fail/Not Executed)** | Not Executed |

## Prerequisites (ข้อกำหนดเบื้องต้น)

| S # | Prerequisites |
|---|---|
| 1 | ลูกค้า (B2C) ได้ติดตามบัญชี LINE Official Account ของร้าน |
| 2 | ลูกค้าได้เข้าสู่ Web Portal ด้วยอีเมลหรือเบอร์โทรศัพท์ |
| 3 | มี Order ที่อยู่ในสถานะต่างๆ (Pending, Washing, Packing, Ready, Completed) |
| 4 | ระบบ LINE OA API และ Web Portal API พร้อมใช้งาน |

## Test Data

| S # | Test Data |
|---|---|
| 1 | LINE User ID: U1234567890abcdef |
| 2 | Customer Email/Phone: customer@example.com / 0812345678 |
| 3 | Order ID: ORD-2026-001, Status: Washing |
| 4 | Expected Completion: 27 Mar 2026, 16:00 |

## Test Scenario

**เสนอเรื่อง:** ลูกค้า B2C สามารถตรวจสอบสถานะ Order ผ่าน LINE OA (Push Message) และ Web Portal ได้เรียลไทม์

### Test Steps

| Step # | Step Details | Expected Results | Actual Results | Pass / Fail / Not Executed / Suspended |
|---|---|---|---|---|
| 1 | ลูกค้าติดตามบัญชี LINE OA และคลิก "ตรวจสอบสถานะ" (Check Status) | LINE Menu แสดงปุ่ม Quick Reply หรือ Persistent Menu พร้อม "สถานะการซัก", "ประวัติการสั่ง" | Not executed | Not executed |
| 2 | LINE OA ส่ง Order Status Message ให้ลูกค้า | ลูกค้าได้รับ Push Message: "Order ORD-2026-001 - สถานะ: กำลังซัก (Washing) - คาดว่าเสร็จ 27 Mar 16:00" | Not executed | Not executed |
| 3 | ลูกค้าเข้า Web Portal ด้วยอีเมล/เบอร์โทร | ระบบแสดงหน้า Dashboard พร้อมรายการ Order ล่าสุด | Not executed | Not executed |
| 4 | ลูกค้าคลิกเข้า Order ORD-2026-001 | ระบบแสดงรายละเอียด: สถานะ, วันที่สั่ง, เสื้อผ้าที่ส่ง, ราคา, วันคาดว่าเสร็จ | Not executed | Not executed |
| 5 | Admin อัปเดตสถานะเป็น "Packing" | ลูกค้าได้รับ Push Message ใน LINE: "Order ORD-2026-001 เปลี่ยนสถานะเป็น: จัดเรียง (Packing)" และ Web Portal อัปเดตทันที | Not executed | Not executed |
| 6 | ลูกค้าตรวจสอบประวัติการสั่งในอดีต | Web Portal แสดงรายการ Order ทั่งหมดพร้อมวันที่, ราคารวม, สถานะ (Complete/Cancel) | Not executed | Not executed |

---

## Test Case Notes

- **Module Under Test:** Order Tracking & Customer Communication (B2C)
- **API Endpoints:** GET `/orders/{orderId}` (Status Detail), GET `/orders/by-customer` (Customer Orders), PATCH `/orders/{orderId}/status` (Update Status)
- **External Integration:** LINE OA API (Push Message, Quick Reply)
- **Channels:** LINE Official Account, Web Portal
- **Database Tables:** `orders`, `order_items`, `order_status_history`
- **Real-time Features:** Push Notification, Web Portal Auto-refresh
- **Status:** Ready for Testing

## Test Result Summary

| Total Steps | Passed | Failed | Not Executed |
|---|---|---|---|
| 6 | 0 | 0 | 6 |
