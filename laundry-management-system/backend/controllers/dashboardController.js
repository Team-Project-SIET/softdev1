const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
    // 🛠️ Helper Function 1: สำหรับดึงข้อมูลแถวเดียว (เช่น COUNT, SUM)
    const getSingle = (sql) => new Promise((resolve, reject) => {
        db.get(sql, [], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    // 🛠️ Helper Function 2: สำหรับดึงข้อมูลหลายแถว (เช่น GROUP BY)
    const getMultiple = (sql) => new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    try {
        // 🚀 ดึงข้อมูล 5 ส่วนหลักๆ แบบขนาน (Parallel) เพื่อความเร็วสูงสุด
        const [
            totalOrdersResult,
            revenueResult,
            statusCounts,
            driversResult,
            customersResult
        ] = await Promise.all([
            getSingle(`SELECT COUNT(*) as totalOrders FROM orders`), // 1. ออเดอร์ทั้งหมด
            getSingle(`SELECT SUM(total_price) as totalRevenue FROM orders WHERE status = 'Completed' OR payment_status = 'Paid'`), // 2. รายได้รวม
            getMultiple(`SELECT status, COUNT(*) as count FROM orders GROUP BY status`), // 3. สถานะออเดอร์ (ทำกราฟโดนัท)
            getSingle(`SELECT COUNT(*) as totalDrivers FROM users WHERE role = 'driver'`), // 4. จำนวนพนักงานขับรถ
            getSingle(`SELECT COUNT(*) as totalCustomers FROM users WHERE role = 'customer'`) // 5. จำนวนลูกค้าทั้งหมด (💡 เพิ่มให้ใหม่)
        ]);

        // 🛡️ ป้องกันบั๊กกรณีที่ค่าเป็น null (เช่น ยังไม่มีใครจ่ายเงิน SUM จะคืนค่า null)
        res.status(200).json({
            total_orders: totalOrdersResult ? totalOrdersResult.totalOrders : 0,
            total_revenue: (revenueResult && revenueResult.totalRevenue) ? revenueResult.totalRevenue : 0,
            total_drivers: driversResult ? driversResult.totalDrivers : 0,
            total_customers: customersResult ? customersResult.totalCustomers : 0,
            order_status_summary: statusCounts || []
        });

    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ', error: error.message });
    }
};