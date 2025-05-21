// File: backend/src/controllers/authController.js
const jwt = require('jsonwebtoken'); // For simulating token generation
// const { users } = require('../data/dummyData'); // Mock 데이터 주석 처리
const bcrypt = require('bcrypt'); // bcrypt 라이브러리 가져오기
const pool = require('../config/database'); // database.js에서 pool 가져오기

const JWT_SECRET = 'mock-jwt-secret-for-presentation'; // Mock secret
const JWT_EXPIRES_IN = '1h';
const SALT_ROUNDS = 10; // bcrypt 솔트 라운드

// register 함수를 비동기 함수로 변경하고 DB 연동 로직 추가
exports.register = async (req, res) => {
    const { userId, password, name, email, phone, gender, birthDate, address } = req.body; // 모든 필드 가져오기

    // 필수 필드 확인 (백엔드에서도 다시 확인하는 것이 안전)
    if (!userId || !password || !name || !email) {
        return res.status(400).json({ message: '필수 입력 필드가 누락되었습니다 (아이디, 비밀번호, 이름, 이메일).' });
    }

    let connection; // connection 변수 선언
    try {
        // 1. 사용자 아이디 중복 확인
        connection = await pool.getConnection(); // 풀에서 연결 가져오기
        const [existingUsers] = await connection.query('SELECT user_id FROM users WHERE user_id = ?', [userId]);

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });
        }

        // 2. 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // 3. 사용자 정보 데이터베이스에 삽입
        // birthDate는 Date 객체일 수 있으므로 MySQL DATE 형식 문자열로 변환 필요
        const formattedBirthDate = birthDate ? new Date(birthDate).toISOString().split('T')[0] : null;

        const [result] = await connection.query(
            'INSERT INTO users (user_id, password, name, email, phone, gender, created_at, updated_at, status) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)',
            [userId, hashedPassword, name, email, phone, gender, 'active']
        );

        console.log('회원가입 성공:', userId);
        res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.', userId: userId });

    } catch (error) {
        console.error('회원가입 중 오류 발생:', error);
        // 데이터베이스 오류 발생 시 500 Internal Server Error 반환
        res.status(500).json({ message: '회원가입 중 서버 오류가 발생했습니다.', error: error.message });
    } finally {
        // 연결 객체가 존재하면 반환
        if (connection) {
            connection.release();
        }
    }
};

exports.login = (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    // For mockup, a very simple check. In real app, use bcrypt.compare with hashed passwords.
    const user = users.find(u => u.username === username && u.password === password); // Direct password check for mock

    if (!user) {
        // Try finding by username only to give a slightly more specific mock error
        if (!users.find(u => u.username === username)) {
             return res.status(401).json({ message: 'Mock login failed: User not found.' });
        }
        return res.status(401).json({ message: 'Mock login failed: Incorrect password.' });
    }

    const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
    console.log('Mock Login: User logged in', user.username);
    res.json({ 
        message: 'Mock login successful.', 
        token, 
        user: { id: user.id, username: user.username, role: user.role }
    });
};

// // 실제 API 호출 버전
// export const login = async (username, password) => {
//     const response = await fetch('http://localhost:3001/api/auth/login', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ username, password })
//     });

//     if (!response.ok) {
//         // 서버에서 에러 메시지를 반환하면 읽어서 전달
//         const errorData = await response.json();
//         throw new Error(errorData.message || '로그인 실패');
//     }

//     // 성공 시 서버에서 받은 사용자 정보 반환
//     const data = await response.json();
//     return data;
// };