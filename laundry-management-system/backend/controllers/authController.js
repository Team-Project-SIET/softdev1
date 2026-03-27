const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 🔒 ดึงคีย์ลับจากไฟล์ .env (ถ้าไม่มีให้ใช้ค่าสำรอง)
const SECRET_KEY = process.env.JWT_SECRET || 'laundry_super_secret_key'; 

// --- 📌 ฟังก์ชัน สมัครสมาชิก (Register) ---
exports.register = async (req, res) => {
    const { name, email, password, role, phone, address } = req.body;

    // 1. ตรวจสอบว่ากรอกข้อมูลครบไหม (เพิ่ม phone และ address ให้ตรงกับ Frontend)
    if (!name || !email || !password || !role || !phone || !address) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่องครับ' });
    }

    try {
        // 2. เข้ารหัสผ่านก่อนบันทึกลงฐานข้อมูล (Salt 10 รอบ)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. บันทึกลง Database
        const sql = `INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(sql, [name, email, hashedPassword, role, phone, address], function(err) {
            if (err) {
                // ดัก Error กรณีอีเมลซ้ำ (SQLite จะฟ้องว่า UNIQUE constraint failed)
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานในระบบแล้วครับ' });
                }
                return res.status(500).json({ message: 'เกิดข้อผิดพลาดของระบบฐานข้อมูล', error: err.message });
            }
            
            // สมัครสำเร็จ คืนค่า ID กลับไป
            res.status(201).json({ 
                message: 'สมัครสมาชิกสำเร็จ', 
                userId: this.lastID 
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้ารหัสข้อมูล' });
    }
};

// --- 📌 ฟังก์ชัน เข้าสู่ระบบ (Login) ---
exports.login = (req, res) => {
    const { email, password } = req.body;

    // 1. ตรวจสอบการกรอกข้อมูล
    if (!email || !password) {
        return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    // 2. ค้นหาผู้ใช้จากอีเมล
    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], async (err, user) => {
        if (err) return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล' });
        if (!user) return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้งานนี้ในระบบ' });

        // 3. ตรวจสอบรหัสผ่านว่าตรงกันไหม (เปรียบเทียบรหัสที่พิมพ์มา กับ Hash ใน DB)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });

        // 4. สร้าง Token (ตั๋วผ่านทาง) มีอายุ 1 วัน
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            SECRET_KEY, 
            { expiresIn: '1d' }
        );

        // 5. ส่ง Token และข้อมูลผู้ใช้กลับไปให้ Vue.js เก็บลง LocalStorage
        res.status(200).json({ 
            message: 'เข้าสู่ระบบสำเร็จ', 
            token, 
            user: { 
                id: user.id, 
                name: user.name, 
                role: user.role,
                phone: user.phone,      // เพิ่มเข้ามาเพื่อให้ Frontend ดึงไปใช้งานต่อได้
                address: user.address   // เพิ่มเข้ามาเพื่อให้ Frontend ดึงไปใช้งานต่อได้
            } 
        });
    });
};