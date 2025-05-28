const express = require('express');
const cors = require('cors');
const app = express();

// CORS 설정
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// JSON 파싱 미들웨어
app.use(express.json());

// 기본 라우트
app.get('/', (req, res) => {
    res.json({
        message: '테스트 서버가 정상적으로 실행 중입니다.',
        version: '1.0.0'
    });
});

// 알림 설정 테스트 라우트
app.get('/api/notifications/settings', (req, res) => {
    res.json({
        success: true,
        data: {
            email_enabled: true,
            push_enabled: true,
            sensor_alerts: true,
            device_alerts: true,
            system_alerts: true,
            workflow_alerts: true,
            sensor_threshold_enabled: true,
            sensor_threshold_min: 0.00,
            sensor_threshold_max: 100.00,
            quiet_hours_enabled: false,
            quiet_hours_start: '22:00',
            quiet_hours_end: '08:00'
        }
    });
});

// 센서 알림 설정 테스트 라우트
app.get('/api/sensor-alerts/settings', (req, res) => {
    res.json({
        success: true,
        data: {
            email_enabled: true,
            browser_enabled: true,
            sound_enabled: true,
            critical_only: false,
            quiet_hours_enabled: false,
            quiet_hours_start: '22:00',
            quiet_hours_end: '08:00'
        }
    });
});

// 센서 임계값 테스트 라우트
app.get('/api/sensor-alerts/thresholds', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                sensor_type: 'mq4',
                sensor_name: '메탄 가스 센서',
                unit: 'ppm',
                sensor_location: '서울시 강남구 테헤란로 123',
                normal_min: 0,
                normal_max: 25,
                warning_min: 25,
                warning_max: 50,
                critical_min: 50,
                critical_max: 100,
                spike_threshold: 20,
                enabled: true
            }
        ]
    });
});

// 테스트 알림 생성 라우트
app.post('/api/notifications/test', (req, res) => {
    const { templateKey = 'welcome', customData = {} } = req.body;
    
    const testNotification = {
        id: Date.now(),
        title: customData.title || '테스트 알림',
        message: customData.message || '알림 시스템이 정상적으로 작동하고 있습니다.',
        type: customData.type || 'success',
        category: 'system',
        is_read: false,
        created_at: new Date().toISOString(),
        action_url: null,
        metadata: { ...customData, isTest: true }
    };
    
    res.json({
        success: true,
        data: testNotification,
        message: '테스트 알림이 생성되었습니다.'
    });
});

// 센서 테스트 알림 생성 라우트
app.post('/api/sensor-alerts/test-alert', (req, res) => {
    const { sensor_type = 'mq4', value = 55.0 } = req.body;
    
    const testAlert = {
        id: Date.now(),
        sensor_type: sensor_type,
        sensor_name: '메탄 가스 센서',
        sensor_location: '서울시 강남구 테헤란로 123',
        value: value,
        unit: 'ppm',
        severity: 'warning',
        message: `메탄 가스 센서 경고 수준 감지 (${value}ppm)`,
        alert_type: 'threshold_violation',
        is_resolved: false,
        created_at: new Date().toISOString(),
        metadata: { isTest: true }
    };
    
    res.json({
        success: true,
        data: testAlert,
        message: '테스트 센서 알림이 생성되었습니다.'
    });
});

// 에러 핸들러
app.use((err, req, res, next) => {
    console.error('서버 오류:', err);
    res.status(500).json({
        success: false,
        message: '서버 내부 오류가 발생했습니다.'
    });
});

// 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`테스트 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`서버 확인: http://localhost:${PORT}`);
});

module.exports = app; 