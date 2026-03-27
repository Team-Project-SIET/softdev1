const jwt = require('jsonwebtoken');

// 🔒 ดึงคีย์ลับจากไฟล์ .env (ให้ตรงกับใน authController.js)
const SECRET_KEY = process.env.JWT_SECRET || 'laundry_super_secret_key'; 

exports.verifyToken = (req, res, next) => {
    // 1. ดึง token จาก Header ที่ส่งมา (รองรับทั้ง a เล็กและ A ใหญ่ เพื่อป้องกันบั๊ก)
    const bearerHeader = req.headers['authorization'] || req.headers['Authorization'];
    
    if (!bearerHeader) {
        // ใช้ 401 (Unauthorized) เหมาะสมกว่า 403 ในกรณีที่ไม่มีตั๋วผ่านทางเลย
        return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน (No token provided)' });
    }

    // 2. แยกคำว่า Bearer ออก เอาเฉพาะตัว Token
    const token = bearerHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'รูปแบบ Token ไม่ถูกต้อง' });
    }

    // 3. ตรวจสอบความถูกต้องของ Token
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token หมดอายุหรือไม่ถูกต้อง กรุณาล็อกอินใหม่' });
        }
        
        // 4. 💡 จุดสำคัญที่แก้ไข: จัดกลุ่มข้อมูล user ไว้ใน `req.user` ให้ตรงกับ Controller!
        req.user = {
            id: decoded.id,
            role: decoded.role
        };
        
        next(); // ผ่านด่านไปทำงานต่อใน Controller ได้เลย
    });
};

// --- 🛡️ เพิ่มเติม: ด่านตรวจ Role (เผื่อใช้งาน) ---
// ฟังก์ชันนี้เอาไว้บล็อกไม่ให้คนที่ไม่มีสิทธิ์เข้ามาใช้งาน (เช่น ไม่ให้ลูกค้าเข้ามาลบข้อมูลแอดมิน)
exports.requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== requiredRole) {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้ (Forbidden)' });
        }
        next();
    };
};