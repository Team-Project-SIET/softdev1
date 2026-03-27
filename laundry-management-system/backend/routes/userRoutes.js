const express = require('express');
const router = express.Router();

// 1. Import Controllers และ Middlewares ให้ครบถ้วน
const userController = require('../controllers/userController');
const orderController = require('../controllers/orderController'); // 👉 เพิ่มบรรทัดนี้เข้ามา!
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// ==========================================
// Routes สำหรับจัดการ User (หรือแทรก Order ชั่วคราว)
// ==========================================

// 🛡️ ดูรายชื่อผู้ใช้ -> ต้อง Login + ต้องเป็น Admin เท่านั้นถึงจะดูได้
router.get('/', authMiddleware.verifyToken, roleMiddleware.isAdmin, userController.getAllUsers);

// 🧾 อัปโหลดสลิปชำระเงิน
router.patch('/:id/upload-slip', 
    authMiddleware.verifyToken, 
    roleMiddleware.isCustomer, 
    upload.single('slip'), 
    orderController.uploadSlip // ตอนนี้ Node.js รู้จัก orderController แล้ว!
);

module.exports = router;