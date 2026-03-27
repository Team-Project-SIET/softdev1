const db = require('../config/db');

// 🟢 ดูรายการบริการทั้งหมด (ลูกค้าใช้ดูราคา / แอดมินใช้จัดการ)
exports.getAllServices = (req, res) => {
    db.all(`SELECT * FROM services ORDER BY price_per_unit ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching services', error: err.message });
        res.json(rows);
    });
};

// 🔵 เพิ่มบริการใหม่ (Admin Only)
exports.addService = (req, res) => {
    const { service_name, price_per_unit, unit_type, description } = req.body;
    const sql = `INSERT INTO services (service_name, price_per_unit, unit_type, description) VALUES (?, ?, ?, ?)`;
    
    db.run(sql, [service_name, price_per_unit, unit_type, description], function(err) {
        if (err) return res.status(500).json({ message: 'Error adding service', error: err.message });
        res.status(201).json({ message: 'เพิ่มบริการสำเร็จ', serviceId: this.lastID });
    });
};

// 🔴 ลบบริการ (Admin Only)
exports.deleteService = (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM services WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ message: 'Error deleting service' });
        res.json({ message: 'ลบบริการเรียบร้อยแล้ว' });
    });
};