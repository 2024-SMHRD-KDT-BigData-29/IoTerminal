const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcrypt');

// 회원가입 라우트
router.post('/signup', async (req, res) => {
    try {
        console.log('회원가입 요청 받음:', req.body);
        const { user_id, password, name, email, phone } = req.body;
        
        // 필수 필드 검증
        if (!user_id || !password || !name) {
            return res.status(400).json({
                success: false,
                message: '필수 입력 항목이 누락되었습니다.'
            });
        }

        // 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 사용자 정보 저장
        const [result] = await pool.query(
            'INSERT INTO user (user_id, password, name, email, phone) VALUES (?, ?, ?, ?, ?)',
            [user_id, hashedPassword, name, email, phone]
        );

        console.log('회원가입 성공:', { user_id, name });
        
        // 성공 응답
        res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다.',
            userId: user_id
        });
    } catch (error) {
        console.error('회원가입 오류:', error);
        
        // 에러 응답
        res.status(500).json({
            success: false,
            message: '회원가입 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router; 