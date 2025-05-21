// 파일: backend/src/controllers/authController.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/database'); // database.js에서 pool 가져오기

// .env 파일에서 JWT_SECRET 값을 가져오도록 수정
const JWT_SECRET = process.env.JWT_SECRET; 
const JWT_EXPIRES_IN = '1h'; // 토큰 만료 시간
const SALT_ROUNDS = 10; // bcrypt 솔트 라운드

// register 함수
exports.register = async (req, res) => {
    const { userId, password, name, email, phone, gender, birthDate, address } = req.body;

    if (!userId || !password || !name || !email) {
        return res.status(400).json({ message: '필수 입력 필드가 누락되었습니다 (아이디, 비밀번호, 이름, 이메일).' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [existingUsers] = await connection.query('SELECT user_id FROM users WHERE user_id = ?', [userId]);

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const formattedBirthDate = birthDate ? new Date(birthDate).toISOString().split('T')[0] : null;

        // address 필드는 users 테이블에 해당 컬럼이 있어야 합니다. 없다면 SQL 문에서 제외하거나 추가해야 합니다.
        // 예시에서는 users 테이블에 address 컬럼이 있다고 가정하지 않으므로 SQL에서 제외합니다.
        // 만약 address 컬럼이 있다면 INSERT 문과 파라미터 배열에 추가해주세요.
        const [result] = await connection.query(
            'INSERT INTO users (user_id, password, name, email, phone, gender, birth_date, created_at, updated_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)',
            [userId, hashedPassword, name, email, phone, gender, formattedBirthDate, 'active']
        );

        console.log('회원가입 성공:', userId);
        res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.', userId: userId });

    } catch (error) {
        console.error('회원가입 중 오류 발생:', error);
        res.status(500).json({ message: '회원가입 중 서버 오류가 발생했습니다.', error: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// login 함수
exports.login = async (req, res) => {
    const { userId, password } = req.body;
    
    console.log('로그인 요청:', { userId });
    
    if (!userId || !password) {
        return res.status(400).json({ 
            success: false,
            message: '아이디와 비밀번호를 모두 입력해주세요.' 
        });
    }

    // JWT_SECRET이 .env 파일에서 제대로 로드되었는지 확인 (매우 중요)
    if (!JWT_SECRET) {
        console.error('CRITICAL ERROR: JWT_SECRET is not defined in environment variables.');
        console.error('Ensure .env file exists in the project root, is loaded by require("dotenv").config() at application start, and contains a JWT_SECRET value.');
        return res.status(500).json({
            success: false,
            message: '서버 내부 설정 오류입니다. 관리자에게 문의하세요.'
        });
    }

    try {
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE user_id = ?',
            [userId]
        );

        console.log('DB 조회 결과:', users);

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: '아이디 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        const user = users[0];
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('비밀번호 검증 결과:', isValidPassword);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '아이디 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        // JWT 토큰 생성 (수정된 JWT_SECRET 사용)
        const token = jwt.sign(
            { 
                user_id: user.user_id, // 페이로드에는 보통 user_id (DB 컬럼명과 일치) 또는 userId (JS 스타일) 사용
                name: user.name,
                role: user.role || 'user' // user 테이블에 role 컬럼이 없다면 기본값 'user'
            },
            JWT_SECRET, // .env 파일에서 가져온 JWT_SECRET 값 사용
            { expiresIn: JWT_EXPIRES_IN }
        );

        // 응답 데이터에서 비밀번호 제외
        // user 객체에서 password 필드를 제외한 새로운 객체 생성
        const { password: _, ...userWithoutPassword } = user; 

        res.json({
            success: true,
            message: '로그인 성공',
            token,
            user: userWithoutPassword // 비밀번호가 제외된 사용자 정보
        });

    } catch (error) {
        console.error('로그인 처리 중 오류 발생:', error);
        res.status(500).json({
            success: false,
            message: '로그인 처리 중 오류가 발생했습니다.'
        });
    }
};

// 주석 처리된 이전 login 함수 (참고용으로 남겨두거나 삭제 가능)
// // 실제 API 호출 버전
// // export const login = async (username, password) => {
// // ...
// // };