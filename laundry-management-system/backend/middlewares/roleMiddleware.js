// 🛡️ เช็คว่าเป็น Admin หรือไม่
exports.isAdmin = (req, res, next) => {
    // เซฟตี้ด่านแรก: ตรวจสอบว่าผ่าน verifyToken มาหรือยัง และเช็ค Role
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'ปฏิเสธการเข้าถึง: สำหรับผู้ดูแลระบบเท่านั้น' });
    }
    next();
};

// 🚗 เช็คว่าเป็น Driver หรือไม่
exports.isDriver = (req, res, next) => {
    if (!req.user || req.user.role !== 'driver') {
        return res.status(403).json({ message: 'ปฏิเสธการเข้าถึง: สำหรับพนักงานขับรถเท่านั้น' });
    }
    next();
};

// 👤 เช็คว่าเป็น Customer หรือไม่
exports.isCustomer = (req, res, next) => {
    if (!req.user || req.user.role !== 'customer') {
        return res.status(403).json({ message: 'ปฏิเสธการเข้าถึง: สำหรับลูกค้าเท่านั้น' });
    }
    next();
};

// 🤝 เช็คว่าเป็น Admin หรือ Driver (สำหรับการอัปเดตสถานะงาน)
exports.isAdminOrDriver = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'driver')) {
        return res.status(403).json({ message: 'ปฏิเสธการเข้าถึง: คุณไม่มีสิทธิ์จัดการออเดอร์นี้' });
    }
    next();
};