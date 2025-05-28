const express = require('express');
const cors = require('cors');
const app = express();

// CORS 설정
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// JSON 파싱 미들웨어
app.use(express.json());

// 날씨 API 라우터
const weatherRouter = require('./routes/weather');
app.use('/api/weather', weatherRouter);

// 알림 관련 API (최소한만)
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
            quiet_hours_enabled: false,
            quiet_hours_start: '22:00',
            quiet_hours_end: '08:00'
        }
    });
});

app.put('/api/notifications/settings', (req, res) => {
    res.json({
        success: true,
        message: '설정이 저장되었습니다.'
    });
});

app.post('/api/notifications/test', (req, res) => {
    const { customData = {} } = req.body;
    res.json({
        success: true,
        message: '테스트 알림이 전송되었습니다.',
        showBrowserNotification: true,
        notificationData: {
            title: customData.title || '테스트 알림',
            message: customData.message || '일반 알림 시스템이 정상적으로 작동하고 있습니다!',
            type: customData.type || 'success',
            icon: '/favicon.ico'
        }
    });
});

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

app.put('/api/sensor-alerts/settings', (req, res) => {
    res.json({
        success: true,
        message: '센서 알림 설정이 저장되었습니다.'
    });
});

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

app.post('/api/sensor-alerts/test-alert', (req, res) => {
    const { sensor_type = 'mq4', value = 55.0 } = req.body;
    res.json({
        success: true,
        message: '테스트 센서 알림이 전송되었습니다.',
        showBrowserNotification: true,
        notificationData: {
            title: '🚨 센서 이상치 감지',
            message: `메탄 가스 센서에서 경고 수준 감지 (${value}ppm)\n위치: 서울시 강남구 테헤란로 123`,
            type: 'warning',
            icon: '/favicon.ico',
            requireInteraction: true
        }
    });
});

// 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

module.exports = app; 