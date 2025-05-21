const express = require('express');
const cors = require('cors');
const app = express();

// CORS 설정
app.use(cors({
    origin: 'http://localhost:3001', // React 앱의 포트
    credentials: true
}));

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Request Body:', req.body);
    next();
});

// 라우터 연결
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// 테스트 라우트
app.get('/test', (req, res) => {
    res.json({ message: '서버가 정상적으로 실행 중입니다.' });
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

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('=================================');
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log('=================================');
    console.log('사용 가능한 엔드포인트:');
    console.log('- POST /api/auth/signup');
    console.log('- GET /test');
}); 
