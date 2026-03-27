const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/', serviceController.getAllServices); // ใครก็ดูราคาได้
router.post('/', authMiddleware.verifyToken, roleMiddleware.isAdmin, serviceController.addService);
router.delete('/:id', authMiddleware.verifyToken, roleMiddleware.isAdmin, serviceController.deleteService);

module.exports = router;