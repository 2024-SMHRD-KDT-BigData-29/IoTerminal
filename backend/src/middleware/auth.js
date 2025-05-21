const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: '인증 토큰이 필요합니다.'
        });
    }

    try {
        // 토큰 검증 시도
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('Decoded token:', decoded); // 디버깅용 로그
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification error:', error); // 디버깅용 로그
        return res.status(403).json({
            success: false,
            error: '유효하지 않은 토큰입니다.'
        });
    }
};

module.exports = {
    authenticateToken
}; 