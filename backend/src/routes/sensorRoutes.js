const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

router.post('/', sensorController.createSensor);
router.get('/', sensorController.getSensors);

module.exports = router; 