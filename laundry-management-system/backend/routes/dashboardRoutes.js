const express = require('express');
const router = express.Router();

// 📁 นำเข้า Controller
const dashboardController = require('../controllers/dashboardController');

// 🛡️ นำเข้า Middlewares (ด่านตรวจความปลอดภัย)
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// ---------------------------------------------------------
// 📊 เส้นทาง API สำหรับแดชบอร์ดสถิติ (Admin Only)
// ---------------------------------------------------------

// ดึงข้อมูลสถิติภาพรวม: ต้อง Login (verifyToken) + ต้องเป็น Admin (isAdmin)
router.get('/', 
    authMiddleware.verifyToken, 
    roleMiddleware.isAdmin, 
    dashboardController.getDashboardStats
);

module.exports = router;