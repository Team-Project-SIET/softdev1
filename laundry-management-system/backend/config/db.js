const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error connecting to SQLite database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database successfully.');
        
        // 1. เปิดการใช้งาน Foreign Key
        db.run('PRAGMA foreign_keys = ON;'); 

        // 2. สร้างตาราง ผู้ใช้งาน (Users)
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('customer', 'admin', 'driver')),
            phone TEXT,
            address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (!err) {
                console.log("✅ Users table is ready.");
                seedAdmin(); 
            }
        });

        // 3. สร้างตาราง รายการบริการ (Services) - [เพิ่มใหม่] เพื่อคุมราคามาตรฐาน
        db.run(`CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service_name TEXT NOT NULL,
            price_per_unit REAL NOT NULL,
            unit_type TEXT DEFAULT 'kg', -- kg, piece, pair
            description TEXT
        )`, (err) => {
            if (!err) {
                console.log("✅ Services table is ready.");
                seedServices(); // สร้างรายการซักรีดเริ่มต้น
            }
        });

        // 4. สร้างตาราง ออเดอร์ (Orders) - [อัปเกรด] เพิ่มช่องเก็บสลิปและลิงก์กับตาราง Services
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            driver_id INTEGER, 
            service_id INTEGER,       -- [เพิ่มใหม่] เชื่อมกับตาราง Services
            service_type TEXT,        -- เก็บชื่อบริการไว้เผื่อกรณีราคาบริการเปลี่ยนในอนาคต
            weight REAL DEFAULT 0,
            notes TEXT,
            pickup_address TEXT NOT NULL,
            delivery_address TEXT NOT NULL,
            total_price REAL NOT NULL,
            payment_method TEXT CHECK(payment_method IN ('QR', 'Credit Card', 'Cash')),
            payment_status TEXT DEFAULT 'Pending' CHECK(payment_status IN ('Pending', 'Paid')),
            payment_slip TEXT,        -- [เพิ่มใหม่] เก็บชื่อไฟล์รูปสลิปโอนเงิน
            status TEXT DEFAULT 'Pending Pickup' CHECK(status IN ('Pending Pickup', 'Washing', 'Packing', 'Ready for Delivery', 'Completed')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
        )`, (err) => {
            if (!err) {
                console.log("✅ Orders table is ready.");
                createUpdateTrigger();
            }
        });

        // 5. สร้างตาราง แจ้งเตือน (Notifications) - [เพิ่มใหม่] สำหรับแจ้งสถานะลูกค้า
        db.run(`CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0, -- 0 = unread, 1 = read
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`, (err) => {
            if (!err) console.log("✅ Notifications table is ready.");
        });
    }
});

// --- 🛠️ ฟังก์ชันเสริม (Auto-System) ---

function createUpdateTrigger() {
    db.run(`
        CREATE TRIGGER IF NOT EXISTS update_orders_timestamp 
        AFTER UPDATE ON orders
        FOR EACH ROW
        BEGIN
            UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
        END;
    `);
}

async function seedAdmin() {
    db.get(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`, async (err, row) => {
        if (!row) {
            const hashedPassword = await bcrypt.hash('admin1234', 10);
            const sql = `INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(sql, ['Super Admin', 'admin@laundry.com', hashedPassword, 'admin', '0800000000', 'Laundry HQ']);
        }
    });
}

// 🟢 ฟังก์ชันเพิ่มรายการบริการเริ่มต้น (ช่วยให้ระบบไม่ว่างเปล่า)
function seedServices() {
    db.get(`SELECT id FROM services LIMIT 1`, (err, row) => {
        if (!row) {
            const services = [
                ['ซักพับ (Wash & Fold)', 50.0, 'kg', 'ซักทำความสะอาดและพับให้เรียบร้อย'],
                ['ซักรีด (Wash & Iron)', 80.0, 'kg', 'ซักสะอาดพร้อมรีดเรียบ'],
                ['ซักแห้ง (Dry Clean)', 200.0, 'piece', 'บริการซักแห้งสำหรับชุดพิเศษ'],
                ['ซักผ้านวม (Blanket/Duvet)', 150.0, 'piece', 'ซักผ้านวมผืนใหญ่']
            ];
            const sql = `INSERT INTO services (service_name, price_per_unit, unit_type, description) VALUES (?, ?, ?, ?)`;
            services.forEach(s => db.run(sql, s));
            console.log("🌟 เพิ่มรายการบริการเริ่มต้นสำเร็จ!");
        }
    });
}

module.exports = db;