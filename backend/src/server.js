require('dotenv').config(); // <--- 이 줄을 추가하세요!

// File: backend/src/server.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");

const authRoutes = require('./routes/authRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

const app = express();
const httpServer = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Express 앱 CORS 설정 (REST API 요청에 적용)
// Socket.IO 설정과 별개로 Express 앱 미들웨어에 적용해야 합니다.
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true
}));

const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Request Body:', req.body);
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/calendar', calendarRoutes);

app.get('/', (req, res) => {
  res.send('IoT Hub System Backend - MOCKUP MODE');
});

io.on('connection', (socket) => {
    console.log(`Socket.IO client connected: ${socket.id}`);
    socket.emit('welcome', `Welcome to the IoT Hub Mockup, client ${socket.id}!`);
    socket.on('disconnect', () => console.log(`Socket.IO client disconnected: ${socket.id}`));
});

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

httpServer.listen(PORT, () => {
  console.log(`Mock Backend server (Socket.IO) running on port ${PORT}`);
  console.log(`Allowed frontend origin: ${FRONTEND_URL}`);
});