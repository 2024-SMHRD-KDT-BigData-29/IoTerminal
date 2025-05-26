require('dotenv').config();

// File: backend/src/server.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");

// 라우터 import
const authRoutes = require('./routes/authRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const usersRoutes = require('./routes/users');

const app = express();
const httpServer = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// CORS 설정 업데이트
const corsOptions = {
    origin: [FRONTEND_URL, "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

// Socket.IO CORS 설정
const io = new Server(httpServer, {
    cors: corsOptions
});

// Express 앱 CORS 설정
app.use(cors(corsOptions));

const PORT = process.env.PORT || 3001;

// 기본 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request Body:', req.body);
    }
    next();
});

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/users', usersRoutes);

// 테스트 라우트
app.get('/test', (req, res) => {
    res.json({ message: '서버가 정상적으로 실행 중입니다.' });
});

// 기본 라우트
app.get('/', (req, res) => {
    res.send('IoT Hub System Backend - MOCKUP MODE');
});

// 404 에러 처리
app.use((req, res, next) => {
    console.log('404 에러 발생:', req.method, req.url);
    res.status(404).json({
        success: false,
        message: '요청한 리소스를 찾을 수 없습니다.',
        path: req.url
    });
});

// 에러 처리 미들웨어
app.use((err, req, res, next) => {
    console.error('서버 에러:', err);
    res.status(500).json({
        success: false,
        message: '서버 에러가 발생했습니다.',
        error: err.message
    });
});

// Socket.IO 연결 처리
io.on('connection', (socket) => {
    console.log(`Socket.IO client connected: ${socket.id}`);
    socket.emit('welcome', `Welcome to the IoT Hub Mockup, client ${socket.id}!`);
    socket.on('disconnect', () => console.log(`Socket.IO client disconnected: ${socket.id}`));
});

// 실시간 센서 데이터 시뮬레이션
let temperature = 23 + Math.random() * 4;
let humidity = 40 + Math.random() * 20;
const sensorDataInterval = setInterval(() => {
    temperature += (Math.random() - 0.5) * 0.2;
    humidity += (Math.random() - 0.5) * 1;
    temperature = Math.max(18, Math.min(32, temperature)); 
    humidity = Math.max(30, Math.min(75, humidity));

    const sensorData = {
        time: new Date().toISOString(),
        temperature: parseFloat(temperature.toFixed(1)),
        humidity: parseFloat(humidity.toFixed(1)),
        pressure: parseFloat((980 + Math.random() * 50).toFixed(1)),
        lightLevel: Math.floor(300 + Math.random() * 400)
    };
    io.emit('newSensorData', sensorData);
}, 2000);

// 서버 시작
httpServer.listen(PORT, () => {
    console.log('=================================');
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log('=================================');
    console.log('사용 가능한 엔드포인트:');
    console.log('- POST /api/auth/login');
    console.log('- POST /api/auth/signup');
    console.log('- GET /api/devices/list');
    console.log('- GET /api/devices/:deviceId/status');
    console.log('- POST /api/devices');
    console.log('- PUT /api/devices/:deviceId');
    console.log('- DELETE /api/devices/:deviceId');
    console.log('- GET /api/workflow');
    console.log('- POST /api/workflow');
    console.log('- GET /api/dashboard');
    console.log('- GET /test');
    console.log(`Socket.IO 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`프론트엔드 접근 허용: ${FRONTEND_URL}`);
});