const db = require('../config/database');

exports.linkSensorToDevice = async (req, res) => {
  const { device_id, sensor_id, config } = req.body;
  await db.query(
    'INSERT INTO device_sensors (device_id, sensor_id, config) VALUES (?, ?, ?)',
    [device_id, sensor_id, JSON.stringify(config || {})]
  );
  res.json({ success: true });
};

exports.getDeviceSensors = async (req, res) => {
  const { deviceId } = req.params;
  const [rows] = await db.query(
    `SELECT s.* FROM device_sensors ds
     JOIN sensors s ON ds.sensor_id = s.sensor_id
     WHERE ds.device_id = ?`, [deviceId]
  );
  res.json({ sensors: rows });
}; 