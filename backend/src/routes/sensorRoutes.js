const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

router.post('/', sensorController.createSensor);
router.get('/', sensorController.getSensors);
router.put('/:sensor_id', sensorController.updateSensor);
router.get('/latest-values', sensorController.getSensorsWithLatestValues);
router.get('/:sensor_id/timeseries', sensorController.getSensorTimeSeries);

module.exports = router; 