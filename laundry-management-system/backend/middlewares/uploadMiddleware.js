const multer = require('multer');
const path = require('path');

// ตั้งค่าการเก็บไฟล์
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/slips/'); // เก็บไว้ที่โฟลเดอร์นี้
    },
    filename: (req, file, cb) => {
        // ตั้งชื่อไฟล์ใหม่: orderId-timestamp.jpg
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'slip-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// กรองประเภทไฟล์ (เอาแค่รูปภาพ)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('กรุณาอัปโหลดเฉพาะไฟล์รูปภาพเท่านั้น!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // จำกัดขนาด 2MB
});

module.exports = upload;