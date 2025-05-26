const express = require('express');
const router = express.Router();
const deviceSensorController = require('../controllers/deviceSensorController');

router.post('/link', deviceSensorController.linkSensorToDevice);
router.get('/:deviceId', deviceSensorController.getDeviceSensors);

module.exports = router; 