-- =============================================
-- 센서 이상치 감지 알림 시스템 데이터베이스 설정
-- =============================================

USE mp_24K_bigdata29_p3_1;

-- 센서 이상치 알림 테이블
CREATE TABLE IF NOT EXISTS sensor_anomaly_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_type ENUM('mq4', 'mq136', 'mq137', 'temperature', 'humidity') NOT NULL,
    sensor_name VARCHAR(100) NOT NULL,
    alert_type ENUM('threshold_high', 'threshold_low', 'sudden_spike', 'sudden_drop', 'data_missing', 'sensor_malfunction') NOT NULL,
    current_value DECIMAL(10,2) NOT NULL,
    threshold_value DECIMAL(10,2) NULL,
    previous_value DECIMAL(10,2) NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    message TEXT NOT NULL,
    farmno VARCHAR(10) DEFAULT '1',
    zone VARCHAR(10) DEFAULT 'A',
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sensor_type (sensor_type),
    INDEX idx_alert_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_created_at (created_at),
    INDEX idx_is_resolved (is_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 센서 임계값 설정 테이블
CREATE TABLE IF NOT EXISTS sensor_thresholds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_type ENUM('mq4', 'mq136', 'mq137', 'temperature', 'humidity') NOT NULL UNIQUE,
    sensor_name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    normal_min DECIMAL(10,2) NOT NULL,
    normal_max DECIMAL(10,2) NOT NULL,
    warning_min DECIMAL(10,2) NOT NULL,
    warning_max DECIMAL(10,2) NOT NULL,
    critical_min DECIMAL(10,2) NOT NULL,
    critical_max DECIMAL(10,2) NOT NULL,
    spike_threshold DECIMAL(10,2) NOT NULL COMMENT '급격한 변화 감지 임계값',
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 알림 설정 테이블
CREATE TABLE IF NOT EXISTS alert_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT 1,
    email_enabled BOOLEAN DEFAULT TRUE,
    browser_enabled BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    critical_only BOOLEAN DEFAULT FALSE,
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 기본 센서 임계값 설정 삽입
INSERT INTO sensor_thresholds (sensor_type, sensor_name, unit, normal_min, normal_max, warning_min, warning_max, critical_min, critical_max, spike_threshold) VALUES
('mq4', '메탄 가스 센서', 'ppm', 5.0, 35.0, 3.0, 45.0, 1.0, 60.0, 15.0),
('mq136', '황화수소 가스 센서', 'ppm', 8.0, 45.0, 5.0, 55.0, 2.0, 70.0, 20.0),
('mq137', '암모니아 가스 센서', 'ppm', 2.0, 25.0, 1.0, 35.0, 0.5, 45.0, 12.0),
('temperature', '온도 센서', '°C', 15.0, 30.0, 10.0, 35.0, 5.0, 40.0, 10.0),
('humidity', '습도 센서', '%', 30.0, 80.0, 20.0, 90.0, 10.0, 95.0, 25.0)
ON DUPLICATE KEY UPDATE
    normal_min = VALUES(normal_min),
    normal_max = VALUES(normal_max),
    warning_min = VALUES(warning_min),
    warning_max = VALUES(warning_max),
    critical_min = VALUES(critical_min),
    critical_max = VALUES(critical_max),
    spike_threshold = VALUES(spike_threshold),
    updated_at = CURRENT_TIMESTAMP;

-- 기본 알림 설정 생성
INSERT INTO alert_settings (user_id) VALUES (1)
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;

-- 테스트용 샘플 알림 생성
INSERT INTO sensor_anomaly_alerts (sensor_type, sensor_name, alert_type, current_value, threshold_value, severity, message) VALUES
('mq4', '메탄 가스 센서', 'threshold_high', 48.5, 45.0, 'high', '메탄 가스 농도가 경고 수준을 초과했습니다.'),
('mq136', '황화수소 가스 센서', 'sudden_spike', 62.3, 55.0, 'critical', '황화수소 가스 농도가 급격히 상승했습니다.'),
('mq137', '암모니아 가스 센서', 'threshold_low', 0.8, 1.0, 'medium', '암모니아 가스 센서 값이 비정상적으로 낮습니다.');

-- 테이블 생성 확인
SELECT 'sensor_anomaly_alerts 테이블' as table_name, COUNT(*) as record_count FROM sensor_anomaly_alerts
UNION ALL
SELECT 'sensor_thresholds 테이블' as table_name, COUNT(*) as record_count FROM sensor_thresholds
UNION ALL
SELECT 'alert_settings 테이블' as table_name, COUNT(*) as record_count FROM alert_settings;

-- 생성된 임계값 설정 확인
SELECT sensor_type, sensor_name, normal_min, normal_max, warning_min, warning_max, critical_min, critical_max 
FROM sensor_thresholds ORDER BY sensor_type;

COMMIT;

-- 센서 이상치 감지 알림 시스템 설정 완료 메시지
SELECT '✅ 센서 이상치 감지 알림 시스템 데이터베이스 설정이 완료되었습니다!' as status; 