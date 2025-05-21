const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent
} = require('../controllers/calendarController');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 일정 조회
router.get('/events', getCalendarEvents);

// 일정 생성
router.post('/events', createCalendarEvent);

// 일정 수정
router.put('/events/:eventId', updateCalendarEvent);

// 일정 삭제
router.delete('/events/:eventId', deleteCalendarEvent);

module.exports = router; 