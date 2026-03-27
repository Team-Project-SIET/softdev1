const db = require('../config/db');
// 🟢 1. สร้างออเดอร์ใหม่ (สำหรับลูกค้า)
exports.createOrder = (req, res) => {
    // สมมติว่าดึงจาก req.user.id ถ้าใช้ Token หรือถ้าไม่ได้ใช้ ให้ดึงจาก req.body
    const userId = req.user ? req.user.id : req.body.user_id; 
    const { 
        service_name, 
        total_price, 
        address, 
        payment_method,
        note
    } = req.body;

    if (!userId || !service_name || !address || !total_price || !payment_method) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
    }

    // ปรับชื่อคอลัมน์ให้ตรงกับที่สร้างใน database.js
    const sql = `
        INSERT INTO orders (
            user_id, service_name, total_price, address, payment_method, note, status, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 'Unpaid')
    `;
    
    const params = [userId, service_name, total_price, address, payment_method, note || ''];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างออเดอร์', details: err.message });
        
        res.status(201).json({ 
            success: true,
            message: 'สร้างออเดอร์สำเร็จ!', 
            orderId: this.lastID 
        });
    });
};

// 🔵 2. ดึงข้อมูลออเดอร์ (ตามสิทธิ์ผู้ใช้งาน)
exports.getOrders = (req, res) => {
    // ต้องมี authMiddleware ถึงจะมี req.user
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const userId = req.user.id;
    const userRole = req.user.role;
    
    // ปรับให้ใช้ u.full_name ให้ตรงกับ Database
    let sql = `
        SELECT 
            orders.*, 
            u.full_name AS customer_name, 
            u.phone AS customer_phone,
            d.full_name AS driver_name
        FROM orders 
        LEFT JOIN users u ON orders.user_id = u.id
        LEFT JOIN users d ON orders.driver_id = d.id
    `;
    let params = [];

    // Filter ตาม Role
    if (userRole === 'customer') {
        sql += ` WHERE orders.user_id = ?`;
        params.push(userId);
    } else if (userRole === 'driver') {
        sql += ` WHERE orders.driver_id = ?`;
        params.push(userId);
    }
    // ถ้าเป็น admin ไม่ต้องมี WHERE clause จะดึงมาหมด

    sql += ` ORDER BY orders.created_at DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error fetching orders', details: err.message });
        res.status(200).json(rows);
    });
};

// 📸 3. อัปโหลดสลิปโอนเงิน (สำหรับลูกค้า)
exports.uploadSlip = (req, res) => {
    const orderId = req.params.id;
    const userId = req.user.id; // ใช้ user_id แทน customer_id

    if (!req.file) {
        return res.status(400).json({ error: 'กรุณาแนบไฟล์รูปภาพสลิป' });
    }

    const fileName = req.file.filename;

    // ต้องแน่ใจว่าในตาราง orders มีคอลัมน์ payment_slip ด้วย (ถ้าไม่มีต้องกลับไปเพิ่มใน database.js)
    const sql = `UPDATE orders SET payment_slip = ?, payment_status = 'Pending Review' WHERE id = ? AND user_id = ?`;
    
    db.run(sql, [fileName, orderId, userId], function(err) {
        if (err) return res.status(500).json({ error: 'Error uploading slip', details: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'ไม่พบออเดอร์ หรือคุณไม่มีสิทธิ์อัปเดต' });
        
        res.status(200).json({ success: true, message: 'อัปโหลดสลิปสำเร็จ รอดำเนินการตรวจสอบ', file: fileName });
    });
};

// 🟡 4. มอบหมายงานให้คนขับ (สำหรับ Admin)
exports.assignDriver = (req, res) => {
    const orderId = req.params.id; 
    const { driver_id } = req.body;

    if (!driver_id) return res.status(400).json({ error: 'กรุณาระบุไอดีคนขับ' });

    // เปลี่ยนสถานะเป็น picked_up หรือ assigned ไปด้วยเลยเมื่อมีคนขับ
    const sql = `UPDATE orders SET driver_id = ?, status = 'picked_up' WHERE id = ?`;
    
    db.run(sql, [driver_id, orderId], function(err) {
        if (err) return res.status(500).json({ error: 'Error assigning driver', details: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'ไม่พบออเดอร์ที่ต้องการมอบหมาย' });
        
        res.status(200).json({ message: 'มอบหมายงานสำเร็จ คนขับจะไปรับผ้าเร็วๆ นี้' });
    });
};

// ⚪ 5. อัปเดตสถานะงาน (สำหรับ Admin และ Driver)
exports.updateOrderStatus = (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;
    
    // ปรับสถานะให้ตรงกับที่ใช้ในหน้า Vue (Track.vue)
    const validStatuses = ['pending', 'picked_up', 'washing', 'delivering', 'completed'];
    
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'สถานะไม่ถูกต้อง กรุณาส่ง: ' + validStatuses.join(', ') });
    }

    const sql = `UPDATE orders SET status = ?, updated_at = DATETIME('now', 'localtime') WHERE id = ?`;
    
    db.run(sql, [status, orderId], function(err) {
        if (err) return res.status(500).json({ error: 'Error updating status', details: err.message });
        res.status(200).json({ message: 'อัปเดตสถานะสำเร็จ', newStatus: status });
    });
};

// 💰 6. อัปเดตสถานะการชำระเงิน (สำหรับ Admin)
exports.updatePaymentStatus = (req, res) => {
    const orderId = req.params.id;
    const { payment_status } = req.body;

    if (!['Unpaid', 'Pending Review', 'Paid'].includes(payment_status)) {
        return res.status(400).json({ error: 'สถานะการชำระเงินไม่ถูกต้อง' });
    }

    const sql = `UPDATE orders SET payment_status = ? WHERE id = ?`;
    db.run(sql, [payment_status, orderId], function(err) {
        if (err) return res.status(500).json({ error: 'Error updating payment status', details: err.message });
        res.status(200).json({ message: `ยืนยันการชำระเงินสำเร็จ (สถานะ: ${payment_status})` });
    });
};