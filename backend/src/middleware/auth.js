// 파일: backend/src/middleware/auth.js

const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    console.log(`[AuthMiddleware] CALLED for path: ${req.method} ${req.originalUrl}`);

    const authHeader = req.headers['authorization'];
    console.log('[AuthMiddleware] Authorization header:', authHeader);

    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log('[AuthMiddleware] No token found. Responding with 401.');
        return res.status(401).json({
            success: false,
            error: '인증 토큰이 필요합니다.'
        });
    }

    // 디버깅용 토큰 일부 출력 (운영 시에는 실제 토큰 값 전체 로그는 주의)
    console.log('[AuthMiddleware] Token extracted:', token ? `${token.substring(0, 15)}... (truncated)` : 'null/undefined');

    // ★★★ .env 파일에서 JWT_SECRET 값을 가져와서 사용 ★★★
    const secretForVerification = process.env.JWT_SECRET;

    // JWT_SECRET 환경 변수가 설정되지 않은 경우에 대한 치명적 오류 처리
    if (!secretForVerification) {
        console.error('[AuthMiddleware] CRITICAL ERROR: JWT_SECRET is not defined in environment variables.');
        console.error('[AuthMiddleware] Ensure .env file exists, is loaded by require("dotenv").config() at app start, and contains JWT_SECRET.');
        return res.status(500).json({
            success: false,
            error: '서버 내부 인증 설정 오류입니다. 관리자에게 문의하세요.'
        });
    }

    try {
        console.log('[AuthMiddleware] Attempting to verify token...');
        const decoded = jwt.verify(token, secretForVerification);
        console.log('[AuthMiddleware] Token verification SUCCESS. Decoded payload:', decoded);
        
        if (!decoded.user_id) {
            throw new Error('Token payload missing user_id');
        }
        
        req.user = {
            user_id: decoded.user_id,
            ...decoded
        };
        next();
    } catch (error) {
        console.error('[AuthMiddleware] Token verification FAILED:', error.message);
        console.error('Error stack:', error.stack);
        console.error('JWT_SECRET exists:', !!process.env.JWT_SECRET);
        console.error('JWT_SECRET value:', process.env.JWT_SECRET ? '[EXISTS]' : '[UNDEFINED]');
        
        let status = 403;
        let errorMessage = '유효하지 않은 토큰입니다.';
        
        if (error.name === 'TokenExpiredError') {
            errorMessage = '토큰이 만료되었습니다. 다시 로그인해주세요.';
        } else if (error.name === 'JsonWebTokenError') {
            if (error.message === 'invalid signature') {
                errorMessage = '토큰 서명이 유효하지 않습니다.';
            } else if (error.message === 'jwt malformed') {
                errorMessage = '토큰 형식이 올바르지 않습니다.';
            }
        } else if (error.message === 'Token payload missing user_id') {
            status = 400;
            errorMessage = '토큰에 사용자 ID 정보가 없습니다.';
        }

        return res.status(status).json({
            success: false,
            error: errorMessage,
            errorCode: error.name
        });
    }
};

module.exports = {
    authenticateToken
};