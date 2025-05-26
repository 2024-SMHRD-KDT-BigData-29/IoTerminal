const createDeviceSensorsTable = `
CREATE TABLE IF NOT EXISTS device_sensors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_id INT NOT NULL,
    device_id INT NOT NULL,
    sensor_id INT NOT NULL,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(workflow_id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
    FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id) ON DELETE CASCADE,
    UNIQUE KEY unique_device_sensor_workflow (workflow_id, device_id, sensor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

module.exports = {
    up: async (connection) => {
        await connection.query(createDeviceSensorsTable);
    },
    down: async (connection) => {
        await connection.query('DROP TABLE IF EXISTS device_sensors');
    }
}; 