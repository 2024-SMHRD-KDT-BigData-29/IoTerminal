const db = require('../config/database');

exports.createSensor = async (req, res) => {
  const { name, type, description, config } = req.body;
  // 중복 체크 (이름+타입)
  const [rows] = await db.query('SELECT sensor_id FROM sensors WHERE name=? AND type=?', [name, type]);
  if (rows.length > 0) {
    return res.json({ success: true, sensor_id: rows[0].sensor_id });
  }
  const [result] = await db.query(
    'INSERT INTO sensors (name, type, description, config) VALUES (?, ?, ?, ?)',
    [name, type, description, JSON.stringify(config || {})]
  );
  res.json({ success: true, sensor_id: result.insertId });
};

exports.getSensors = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM sensors');
  res.json({ sensors: rows });
}; 