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