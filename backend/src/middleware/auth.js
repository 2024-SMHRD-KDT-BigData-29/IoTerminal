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
        return res.status(500).json({ // 서버 설정 오류이므로 500 반환
            success: false,
            error: '서버 내부 인증 설정 오류입니다. 관리자에게 문의하세요.'
        });
    }

    try {
        console.log('[AuthMiddleware] Attempting to verify token...');
        // 수정: jwt.verify의 두 번째 인자로 secretForVerification (즉, process.env.JWT_SECRET) 사용
        const decoded = jwt.verify(token, secretForVerification); 

        console.log('[AuthMiddleware] Token verification SUCCESS. Decoded payload:', decoded);
        req.user = decoded; // req 객체에 디코딩된 사용자 정보 추가
        next(); // 다음 미들웨어나 라우트 핸들러로 요청 전달
    } catch (error) {
        console.error('[AuthMiddleware] Token verification FAILED. Error object:', error);

        let errorMessage = '유효하지 않은 토큰입니다.'; // 기본 에러 메시지
        if (error.name === 'TokenExpiredError') {
            errorMessage = '토큰이 만료되었습니다. 다시 로그인해주세요.';
        } else if (error.name === 'JsonWebTokenError') {
            // JsonWebTokenError의 경우 다양한 메시지가 있을 수 있으므로, 좀 더 포괄적인 메시지 또는 에러 객체의 메시지 일부를 포함할 수 있습니다.
            // 여기서는 일반적인 "유효하지 않은 토큰" 메시지를 유지하거나, error.message를 포함시킬 수 있습니다.
            // 예: errorMessage = `토큰 형식이 올바르지 않거나 서명이 유효하지 않습니다. (${error.message})`;
            // 하지만 사용자에게 너무 자세한 기술적 오류를 노출하는 것은 좋지 않을 수 있습니다.
            // 지금은 'invalid signature' 오류를 해결하는 데 집중하고 있으므로,
            // Secret Key가 일치하면 이 부분은 TokenExpiredError 외에는 잘 발생하지 않아야 합니다.
            if (error.message === 'invalid signature') {
                 errorMessage = '토큰 서명이 유효하지 않습니다. (서버 설정 확인 필요)';
            }
        }

        return res.status(403).json({ // 403 Forbidden 반환
            success: false,
            error: errorMessage,
            errorCode: error.name // 에러 종류 코드 전달 (프론트에서 분기 처리 시 유용할 수 있음)
        });
    }
};

module.exports = {
    authenticateToken
};