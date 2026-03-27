require('dotenv').config(); 
const express = require('express'); 
const cors = require('cors');       
const path = require('path');
const db = require('./config/db.js'); 

// --- 1. นำเข้า Routes ---
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// --- 2. Middleware ---
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- 3. API Routes ---
// หน้าแรกของ API
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Laundry Management System API is running...',
    version: '1.0.0'
  });
});

// เชื่อมต่อเส้นทาง API ต่างๆ
app.use('/api/auth', authRoutes);         
app.use('/api/orders', orderRoutes);      
app.use('/api/users', userRoutes);        
app.use('/api/dashboard', dashboardRoutes); 

// --- 4. 🛑 404 Not Found Handler (จุดที่แก้ไข!) ---
// ใน Express 5 ไม่ต้องใส่ '*' แล้วครับ ให้ปล่อยว่างไว้ มันจะดักจับทุกอย่างที่หลุดมาจาก Route ด้านบนเอง
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `ไม่พบเส้นทาง API: ${req.originalUrl}`
  });
});



// --- 5. Global Error Handler (ดักจับ Error 500) ---
app.use((err, req, res, next) => {
    // พิมพ์ Error ออกทาง Console เพื่อให้เราแก้บั๊กได้ง่ายขึ้น
    console.error('❌ Server Error Detail:', err.message);
    
    // ส่ง Response กลับไปหาหน้าบ้าน (Frontend)
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ 
        success: false,
        message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์', 
        // แสดงรายละเอียด error เฉพาะตอนพัฒนา (Development) เท่านั้น เพื่อความปลอดภัย
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error' 
    });
});

// --- 6. Start Server ---
// ตรวจสอบพอร์ตก่อนเริ่มทำงาน (ป้องกันพอร์ตชนกัน)
const server = app.listen(PORT, () => {
  console.log(`-----------------------------------------`);
  console.log(`🚀 Laundry System Backend is LIVE!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🛠️  Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`-----------------------------------------`);
});

// ป้องกันระบบค้างหากเกิด Uncaught Exception
process.on('unhandledRejection', (err) => {
    console.log(`❌ Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
});