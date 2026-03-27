const db = require('../config/db');

// 🟢 1. ดึงรายชื่อผู้ใช้งานทั้งหมด (รองรับการกรอง Role และการค้นหาชื่อ/อีเมล)
exports.getAllUsers = (req, res) => {
    const { role, search } = req.query; // ดึงค่าจาก URL เช่น /api/users?role=customer&search=สมชาย
    
    // ใช้ WHERE 1=1 เป็นทริคเพื่อให้ต่อคำสั่ง AND ได้ง่ายขึ้น
    let sql = `SELECT id, name, email, role, phone, address, created_at FROM users WHERE 1=1`;
    let params = [];

    // --- กรองตาม Role ---
    if (role) {
        const validRoles = ['customer', 'driver', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'ระบุประเภทผู้ใช้งาน (Role) ไม่ถูกต้อง' });
        }
        sql += ` AND role = ?`;
        params.push(role);
    }

    // --- ค้นหาจากชื่อ หรือ อีเมล (ระบบ Search) ---
    if (search) {
        sql += ` AND (name LIKE ? OR email LIKE ?)`;
        // ใช้ % เพื่อให้ค้นหาคำที่ซ่อนอยู่ตรงกลางได้ เช่น พิมพ์ "สม" ก็เจอ "สมชาย"
        params.push(`%${search}%`, `%${search}%`); 
    }

    sql += ` ORDER BY created_at DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้', error: err.message });
        res.status(200).json(rows);
    });
};

// 🔵 2. ดึงข้อมูลผู้ใช้งาน 1 คน (เผื่อ Admin อยากคลิกดูรายละเอียด)
exports.getUserById = (req, res) => {
    const userId = req.params.id;

    const sql = `SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = ?`;
    
    db.get(sql, [userId], (err, user) => {
        if (err) return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล', error: err.message });
        if (!user) return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้งานนี้' });
        
        res.status(200).json(user);
    });
};

// 🔴 3. ลบผู้ใช้งาน (สำหรับ Admin ใช้ลบบัญชีที่มีปัญหา)
exports.deleteUser = (req, res) => {
    const userId = req.params.id;

    // เช็คก่อนว่า Admin ไม่ได้กำลังเผลอลบตัวเอง
    if (userId == req.user.id) {
        return res.status(400).json({ message: 'ไม่อนุญาตให้ลบบัญชีของคุณเองได้' });
    }

    const sql = `DELETE FROM users WHERE id = ?`;
    
    db.run(sql, [userId], function(err) {
        if (err) return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูล', error: err.message });
        
        if (this.changes === 0) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้งานที่ต้องการลบ' });
        }
        
        res.status(200).json({ message: 'ลบข้อมูลผู้ใช้งานสำเร็จเรียบร้อย' });
    });
};