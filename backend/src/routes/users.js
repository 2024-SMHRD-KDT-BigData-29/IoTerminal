const express = require('express');
const router = express.Router();
const { authenticateToken: authMiddleware } = require('../middleware/auth');
const userController = require('../controllers/authController'); // 사용자 정보 수정은 authController에 구현

// 사용자 정보 수정
router.put('/update', authMiddleware, userController.updateUser);

module.exports = router; 