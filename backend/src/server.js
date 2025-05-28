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
const sensorRoutes = require('./routes/sensorRoutes');
const deviceSensorRoutes = require('./routes/deviceSensorRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const sensorAnomalyRoutes = require('./routes/sensorAnomalyRoutes');

// 서비스 import
const sensorAnomalyService = require('./services/sensorAnomalyService');

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
app.use('/api/sensors', sensorRoutes);
app.use('/api/device-sensors', deviceSensorRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/sensor-alerts', sensorAnomalyRoutes);

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
    
    // 센서 이상치 알림 관련 소켓 이벤트
    socket.on('join_sensor_alerts', (userId) => {
        socket.join(`sensor_alerts_${userId}`);
        console.log(`사용자 ${userId}가 센서 알림 룸에 참가했습니다.`);
    });
    
    socket.on('disconnect', () => console.log(`Socket.IO client disconnected: ${socket.id}`));
});

// 실시간 센서 알림 전송 함수
const sendSensorAlert = (alert) => {
    // 모든 연결된 클라이언트에게 센서 알림 전송
    io.emit('sensor_anomaly_alert', alert);
    console.log(`🚨 실시간 센서 알림 전송: ${alert.sensor_name} - ${alert.alert_type}`);
};

// 실제 센서 데이터를 가져와서 실시간 전송
const db = require('./config/database');

let sensorDataInterval;
let dataInsertInterval;

// 센서 데이터를 DB에 주기적으로 삽입
const startDataInsertion = () => {
    // DB 삽입용 별도 값 관리 (가스 센서만)
    let dbValues = {
        mq4: 16,
        mq136: 23,
        mq137: 11
    };
    
    let dbInitialized = false;

    dataInsertInterval = setInterval(async () => {
        try {
            // 첫 실행 시 DB에서 최신 값 가져오기
            if (!dbInitialized) {
                try {
                    const [latestRows] = await db.query('SELECT * FROM sensor ORDER BY dt DESC LIMIT 1');
                    if (latestRows.length > 0) {
                        const latest = latestRows[0];
                        dbValues.mq4 = parseFloat(latest.mq4) || 16;
                        dbValues.mq136 = parseFloat(latest.mq136) || 23;
                        dbValues.mq137 = parseFloat(latest.mq137) || 11;
                        console.log('💾 DB 삽입용 초기값 로드:', dbValues);
                    }
                } catch (dbError) {
                    console.warn('DB 삽입용 초기값 로드 실패, 기본값 사용:', dbError.message);
                }
                dbInitialized = true;
            }

            // 현실적인 센서 데이터 생성
            const now = new Date();
            const timeOfDay = now.getHours() + now.getMinutes() / 60;
            const dayPattern = Math.sin((timeOfDay - 6) / 12 * Math.PI) * 0.4;
            
            // 자연스러운 변화 (더 작은 변화량)
            dbValues.mq4 += (Math.random() - 0.5) * 1.2 + dayPattern * 0.3;
            dbValues.mq136 += (Math.random() - 0.5) * 1.5 + dayPattern * 0.4;
            dbValues.mq137 += (Math.random() - 0.5) * 0.8 + dayPattern * 0.2;
            
            // 범위 제한
            dbValues.mq4 = Math.max(8, Math.min(40, dbValues.mq4));
            dbValues.mq136 = Math.max(12, Math.min(50, dbValues.mq136));
            dbValues.mq137 = Math.max(4, Math.min(30, dbValues.mq137));
            
            const sensorData = {
                dt: now.toISOString().slice(0, 19).replace('T', ' '), // MySQL datetime 형식
                mq4: parseFloat(dbValues.mq4.toFixed(1)),
                mq136: parseFloat(dbValues.mq136.toFixed(1)),
                mq137: parseFloat(dbValues.mq137.toFixed(1)),
                temperature: null, // NULL로 설정
                humidity: null, // NULL로 설정
                farmno: '1',
                zone: 'A'
            };
            
            // DB에 데이터 삽입
            await db.query(
                'INSERT INTO sensor (dt, mq4, mq136, mq137, temperature, humidity, farmno, zone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [sensorData.dt, sensorData.mq4, sensorData.mq136, sensorData.mq137, sensorData.temperature, sensorData.humidity, sensorData.farmno, sensorData.zone]
            );
            
            console.log('💾 새로운 센서 데이터 DB 삽입:', sensorData);
        } catch (error) {
            console.error('센서 데이터 삽입 오류:', error);
        }
    }, 20000); // 20초마다 새 데이터 삽입 (DB 부하 고려)
};

const startRealTimeSensorData = () => {
    // 기본값 설정 (가스 센서만) - 초기값은 DB에서 가져올 예정
    let currentValues = {
        mq4: 18,
        mq136: 25,
        mq137: 12
    };
    
    let isInitialized = false;
    
    // 특별 이벤트 상태
    let eventTimer = 0;
    let isEventActive = false;

    sensorDataInterval = setInterval(async () => {
        try {
            // 첫 실행 시 DB에서 최신 값 가져오기
            if (!isInitialized) {
                try {
                    const [latestRows] = await db.query('SELECT * FROM sensor ORDER BY dt DESC LIMIT 1');
                    if (latestRows.length > 0) {
                        const latest = latestRows[0];
                        currentValues.mq4 = parseFloat(latest.mq4) || 18;
                        currentValues.mq136 = parseFloat(latest.mq136) || 25;
                        currentValues.mq137 = parseFloat(latest.mq137) || 12;
                        console.log('🔄 DB에서 초기값 로드:', currentValues);
                    }
                } catch (dbError) {
                    console.warn('DB 초기값 로드 실패, 기본값 사용:', dbError.message);
                }
                isInitialized = true;
            }

            const now = new Date();
            const timeOfDay = now.getHours() + now.getMinutes() / 60;
            
            // 시간대별 기본 패턴
            const dayPattern = Math.sin((timeOfDay - 6) / 12 * Math.PI) * 0.3; // 낮에 높고 밤에 낮음
            const hourlyVariation = Math.sin(now.getMinutes() / 60 * 2 * Math.PI) * 0.2;
            
            // 랜덤 이벤트 발생 (3% 확률로 조정)
            if (!isEventActive && Math.random() < 0.03) {
                isEventActive = true;
                eventTimer = 25; // 25회 지속 (50초)
                console.log('🚨 센서 이벤트 발생!');
            }
            
            // 이벤트 처리
            let eventMultiplier = 1;
            if (isEventActive) {
                eventMultiplier = 1.3 + Math.random() * 0.4; // 1.3~1.7배 증가
                eventTimer--;
                if (eventTimer <= 0) {
                    isEventActive = false;
                    console.log('✅ 센서 이벤트 종료');
                }
            }
            
            // 각 가스 센서값을 현실적으로 변화 (더 작은 변화량)
            const baseChange = {
                mq4: (Math.random() - 0.5) * 0.8 + dayPattern * 0.3 + hourlyVariation * 0.2,
                mq136: (Math.random() - 0.5) * 1.0 + dayPattern * 0.4 + hourlyVariation * 0.3,
                mq137: (Math.random() - 0.5) * 0.6 + dayPattern * 0.2 + hourlyVariation * 0.1
            };
            
            // 이벤트 시 가스 센서들 급증
            if (isEventActive) {
                baseChange.mq4 *= eventMultiplier;
                baseChange.mq136 *= eventMultiplier;
                baseChange.mq137 *= eventMultiplier;
            }
            
            // 값 업데이트
            currentValues.mq4 += baseChange.mq4;
            currentValues.mq136 += baseChange.mq136;
            currentValues.mq137 += baseChange.mq137;
            
            // 값의 범위 제한 (이벤트 시에는 상한 완화)
            const maxLimits = isEventActive ? 
                { mq4: 60, mq136: 70, mq137: 40 } :
                { mq4: 35, mq136: 45, mq137: 25 };
                
            currentValues.mq4 = Math.max(5, Math.min(maxLimits.mq4, currentValues.mq4));
            currentValues.mq136 = Math.max(8, Math.min(maxLimits.mq136, currentValues.mq136));
            currentValues.mq137 = Math.max(2, Math.min(maxLimits.mq137, currentValues.mq137));

            const sensorData = {
                time: new Date().toISOString(),
                timestamp: now.toISOString().slice(0, 19).replace('T', ' '),
                mq4: parseFloat(currentValues.mq4.toFixed(1)),
                mq136: parseFloat(currentValues.mq136.toFixed(1)),
                mq137: parseFloat(currentValues.mq137.toFixed(1)),
                farmno: '1',
                zone: 'A',
                eventActive: isEventActive // 이벤트 상태 정보
            };
            
            // 센서 데이터 기반 이상치 알림 체크
            try {
                const alerts = await sensorAnomalyService.checkSensorAnomalies({
                    mq4: sensorData.mq4,
                    mq136: sensorData.mq136,
                    mq137: sensorData.mq137,
                    farmno: sensorData.farmno,
                    zone: sensorData.zone
                });

                // 생성된 알림이 있으면 실시간으로 전송
                alerts.forEach(alert => {
                    sendSensorAlert(alert);
                });
            } catch (alertError) {
                console.error('센서 이상치 알림 체크 오류:', alertError);
            }
            
            if (isEventActive) {
                console.log('🔥 이벤트 센서 데이터:', sensorData);
            } else {
                console.log('📊 실시간 센서 데이터:', sensorData);
            }
            io.emit('newSensorData', sensorData);
            
        } catch (error) {
            console.error('센서 데이터 생성 오류:', error);
            
            // 오류 발생 시에도 기본 모의 데이터 전송
            const fallbackData = {
                time: new Date().toISOString(),
                mq4: parseFloat((15 + Math.random() * 10).toFixed(1)),
                mq136: parseFloat((20 + Math.random() * 15).toFixed(1)),
                mq137: parseFloat((10 + Math.random() * 8).toFixed(1)),
                farmno: '1',
                zone: 'A'
            };
            
            io.emit('newSensorData', fallbackData);
        }
    }, 2000); // 2초마다 업데이트
};

// 실시간 데이터 전송 시작
startDataInsertion(); // DB에 데이터 삽입 시작
startRealTimeSensorData(); // 실시간 전송 시작

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
    console.log('- GET /api/sensor-alerts/alerts');
    console.log('- GET /api/sensor-alerts/thresholds');
    console.log('- POST /api/sensor-alerts/test-alert');
    console.log('- GET /test');
    console.log(`Socket.IO 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`프론트엔드 접근 허용: ${FRONTEND_URL}`);
    console.log('실시간 센서 데이터 스트리밍이 시작되었습니다.');
    console.log('🚨 센서 이상치 감지 알림 시스템이 활성화되었습니다.');
});

// 서버 종료 시 정리
process.on('SIGINT', () => {
    console.log('\n서버를 종료합니다...');
    if (sensorDataInterval) {
        clearInterval(sensorDataInterval);
        console.log('센서 데이터 전송 인터벌 정리됨');
    }
    if (dataInsertInterval) {
        clearInterval(dataInsertInterval);
        console.log('데이터 삽입 인터벌 정리됨');
    }
    httpServer.close(() => {
        console.log('서버가 정상적으로 종료되었습니다.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n서버를 종료합니다...');
    if (sensorDataInterval) {
        clearInterval(sensorDataInterval);
        console.log('센서 데이터 전송 인터벌 정리됨');
    }
    if (dataInsertInterval) {
        clearInterval(dataInsertInterval);
        console.log('데이터 삽입 인터벌 정리됨');
    }
    httpServer.close(() => {
        console.log('서버가 정상적으로 종료되었습니다.');
        process.exit(0);
    });
});