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

// 알림 API 라우터
const notificationRouter = require('./routes/notifications');
app.use('/api/notifications', notificationRouter);

// 센서 알림 API 라우터
const sensorAlertRouter = require('./routes/sensor-alerts');
app.use('/api/sensor-alerts', sensorAlertRouter);

// 센서 이상치 탐지 API 라우터 (기존)
const sensorAnomalyRouter = require('./routes/sensorAnomalyRoutes');
app.use('/api/sensor-anomaly', sensorAnomalyRouter);

// 기본 라우트
app.get('/', (req, res) => {
    res.json({
        message: '스마트 센서 시스템 API 서버가 정상적으로 실행 중입니다.',
        version: '1.0.0',
        endpoints: {
            weather: '/api/weather',
            notifications: '/api/notifications',
            sensorAlerts: '/api/sensor-alerts',
            sensorAnomaly: '/api/sensor-anomaly'
        }
    });
});

// 404 에러 핸들러
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '요청하신 API 엔드포인트를 찾을 수 없습니다.',
        path: req.originalUrl
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
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`API 문서: http://localhost:${PORT}`);
});

module.exports = app; 