# Test Case Template

| | | |
|---|---|---|
| **Test Case ID** | TEST-DASH-01 | **Test Case Description** | ตรวจสอบ Financial Dashboard - Profit/Loss |
| **Created By** | Development Team | **Reviewed By** | QA Team | **Version** | 1.0 |
| **QA Tester's Log** | บันทึกการทดสอบ TEST-DASH-01 V 1.0 | | |

| | | | | |
|---|---|---|---|---|
| **Tester's Name** | QA Team | **Date Tested** | 25-Mar-2026 | **Test Case (Pass/Fail/Not Executed)** | Not Executed |

## Prerequisites (ข้อกำหนดเบื้องต้น)

| S # | Prerequisites |
|---|---|
| 1 | ผู้บริหาร (Executive) ได้เข้าสู่ระบบสำเร็จ |
| 2 | ข้อมูลธุรกรรมได้ถูก sync จาก SCB API Sandbox แล้ว |
| 3 | ข้อมูลรายการ Order, Payment, Expense มีอยู่ในฐานข้อมูล |
| 4 | มีข้อมูลอย่างน้อย 10 รายการย้อนหลังมา 30 วัน |

## Test Data

| S # | Test Data |
|---|---|
| 1 | ช่วงวันที่: 25 Feb 2026 - 25 Mar 2026 (30 วัน) |
| 2 | Total Revenue: 5,000 บาท (5 Orders × 1,000 บาท) |
| 3 | Total Expense: 1,500 บาท (น้ำยา, ไฟฟ้า, เงินเดือน) |
| 4 | Expected Profit: 3,500 บาท |

## Test Scenario

**เสนอเรื่อง:** ผู้บริหารสามารถดู Financial Dashboard ที่แสดงข้อมูล Revenue, Expense, Profit/Loss จาก SCB API และ Order System ได้อย่างถูกต้อง

### Test Steps

| Step # | Step Details | Expected Results | Actual Results | Pass / Fail / Not Executed / Suspended |
|---|---|---|---|---|
| 1 | ผู้บริหารคลิกเมนู "Dashboard" → "Financial Dashboard" | ระบบแสดงหน้าจอ Financial Dashboard พร้อมกราฟและตัวเลข KPI | Not executed | Not executed |
| 2 | ตรวจสอบการแสดงข้อมูล Revenue (รายรับ) | ระบบแสดง Total Revenue: 5,000 บาท จากชำระเงินลูกค้า | Not executed | Not executed |
| 3 | ตรวจสอบการแสดงข้อมูล Expense (รายจ่าย) | ระบบแสดง Total Expense: 1,500 บาท จากการบันทึกรายการในระบบ | Not executed | Not executed |
| 4 | ตรวจสอบการคำนวณ Profit/Loss | ระบบแสดง Net Profit: 3,500 บาท (Revenue - Expense) | Not executed | Not executed |
| 5 | ผู้บริหารเลือกช่วงเวลาต่างกัน (เช่น 7 วัน, 14 วัน, 90 วัน) | ระบบอัปเดต Dashboard และแสดงข้อมูลตามช่วงเวลาที่เลือก | Not executed | Not executed |
| 6 | ตรวจสอบกราฟ Cash Flow | ระบบแสดงกราฟแนวโน้มรายรับและรายจ่ายตามช่วงเวลา (Line Chart) | Not executed | Not executed |

---

## Test Case Notes

- **Module Under Test:** Financial Dashboard (Reporting Module)
- **API Endpoints:** GET `/finances/dashboard` (Dashboard Data), GET `/finances/summary` (Summary), GET `/finances/cash-flow` (Cash Flow)
- **External API:** SCB Developer API Sandbox (for transaction data)
- **Database Tables:** `payments`, `expenses`, `finances`, `transactions`
- **Features:** Revenue Calculation, Expense Tracking, Profit/Loss Analysis, Cash Flow Graph, Date Range Filter
- **Status:** Ready for Testing

## Test Result Summary

| Total Steps | Passed | Failed | Not Executed |
|---|---|---|---|
| 6 | 0 | 0 | 6 |
