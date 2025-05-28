-- 알림 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    category ENUM('sensor', 'device', 'system', 'workflow', 'general') DEFAULT 'general',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    action_url VARCHAR(500) NULL,
    metadata JSON NULL,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_type (type),
    INDEX idx_category (category)
);

-- 알림 설정 테이블
CREATE TABLE IF NOT EXISTS notification_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    sensor_alerts BOOLEAN DEFAULT TRUE,
    device_alerts BOOLEAN DEFAULT TRUE,
    system_alerts BOOLEAN DEFAULT TRUE,
    workflow_alerts BOOLEAN DEFAULT TRUE,
    sensor_threshold_enabled BOOLEAN DEFAULT TRUE,
    sensor_threshold_min DECIMAL(10,2) DEFAULT 0.00,
    sensor_threshold_max DECIMAL(10,2) DEFAULT 100.00,
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 알림 템플릿 테이블
CREATE TABLE IF NOT EXISTS notification_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_key VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    category ENUM('sensor', 'device', 'system', 'workflow', 'general') DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 기본 알림 템플릿 데이터 삽입
INSERT INTO notification_templates (template_key, title, message, type, category) VALUES
('sensor_high_value', '센서 임계값 초과', '센서 값이 설정된 임계값을 초과했습니다.', 'warning', 'sensor'),
('sensor_low_value', '센서 임계값 미달', '센서 값이 설정된 임계값 아래로 떨어졌습니다.', 'warning', 'sensor'),
('device_offline', '디바이스 연결 끊김', '디바이스가 오프라인 상태입니다.', 'error', 'device'),
('device_online', '디바이스 연결 복구', '디바이스가 다시 온라인 상태가 되었습니다.', 'success', 'device'),
('workflow_started', '워크플로우 시작', '워크플로우가 시작되었습니다.', 'info', 'workflow'),
('workflow_completed', '워크플로우 완료', '워크플로우가 성공적으로 완료되었습니다.', 'success', 'workflow'),
('workflow_failed', '워크플로우 실패', '워크플로우 실행 중 오류가 발생했습니다.', 'error', 'workflow'),
('system_maintenance', '시스템 점검', '시스템 점검이 예정되어 있습니다.', 'info', 'system'),
('welcome', '환영합니다', 'IoT Hub 시스템에 오신 것을 환영합니다!', 'success', 'general')
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    message = VALUES(message),
    type = VALUES(type),
    category = VALUES(category),
    updated_at = CURRENT_TIMESTAMP; 