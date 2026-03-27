const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// 🛡️ นำเข้า Middlewares
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/uploadMiddleware'); // 🟢 เพิ่ม: ตัวจัดการอัปโหลดไฟล์

// ---------------------------------------------------------
// 🚀 1. ฝั่งลูกค้า (Customer)
// ---------------------------------------------------------

// สร้างออเดอร์ใหม่
router.post('/', 
    authMiddleware.verifyToken, 
    roleMiddleware.isCustomer, 
    orderController.createOrder
);

// อัปโหลดสลิปโอนเงิน (ใช้ PATCH เพราะเป็นการอัปเดตข้อมูลบางส่วน)
router.patch('/:id/upload-slip', 
    authMiddleware.verifyToken, 
    roleMiddleware.isCustomer, 
    upload.single('slip'), // 👈 'slip' คือชื่อ Key ที่ส่งมาจาก Frontend
    orderController.uploadSlip
);

// ---------------------------------------------------------
// 🚀 2. ฝั่งส่วนรวม (All Roles: Customer, Admin, Driver)
// ---------------------------------------------------------

// ดูรายการออเดอร์ (ระบบจะกรองข้อมูลตาม Role ที่ Controller)
router.get('/', 
    authMiddleware.verifyToken, 
    orderController.getOrders
);

// ---------------------------------------------------------
// 🚀 3. ฝั่งผู้ดูแลระบบ (Admin)
// ---------------------------------------------------------

// มอบหมายงานให้คนขับ
router.put('/:id/assign', 
    authMiddleware.verifyToken, 
    roleMiddleware.isAdmin, 
    orderController.assignDriver
);

// ยืนยันยอดเงิน (เปลี่ยน payment_status เป็น Paid)
router.patch('/:id/payment-status', 
    authMiddleware.verifyToken, 
    roleMiddleware.isAdmin, 
    orderController.updatePaymentStatus
);

// ---------------------------------------------------------
// 🚀 4. ฝั่งแอดมินและคนขับ (Admin & Driver)
// ---------------------------------------------------------

// อัปเดตสถานะงาน (เช่น Washing, Packing, Completed)
router.put('/:id/status', 
    authMiddleware.verifyToken, 
    roleMiddleware.isAdminOrDriver, 
    orderController.updateOrderStatus
);

module.exports = router;