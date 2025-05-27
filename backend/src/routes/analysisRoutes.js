const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

// 사용량 분석
router.get('/usage/:deviceId', analysisController.getDeviceUsageData);

// 센서 데이터 분석
router.get('/sensor/:deviceId', analysisController.getDeviceSensorData);

// 이벤트 로그 분석
router.get('/events/:deviceId', analysisController.getDeviceEventLogs);

module.exports = router; 