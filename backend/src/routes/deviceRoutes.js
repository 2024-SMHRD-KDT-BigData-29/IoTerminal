const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
    getUserDevices,
    getDeviceStatus,
    createDevice,
    updateDevice,
    deleteDevice,
    getDeviceDataByDateRange
} = require('../controllers/deviceController');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 디바이스 라우트
router.get('/list', getUserDevices);
router.get('/:deviceId/status', getDeviceStatus);
router.get('/:deviceId/analytics', getDeviceDataByDateRange);
router.post('/', createDevice);
router.put('/:deviceId', updateDevice);
router.delete('/:deviceId', deleteDevice);

module.exports = router; 