const pool = require('../config/database');

// 사용자의 일정 목록 조회
const getCalendarEvents = async (req, res) => {
    const userId = req.user.user_id; // userId -> user_id로 수정
    console.log('Request user:', req.user); // 디버깅용 로그

    if (!userId) {
        return res.status(400).json({
            success: false,
            error: 'user_id가 필요합니다.'
        });
    }

    try {
        const [events] = await pool.query(
            'SELECT * FROM calendar_events WHERE user_id = ? ORDER BY start ASC',
            [userId]
        );

        res.json({
            success: true,
            events
        });
    } catch (error) {
        console.error('일정 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '일정 조회에 실패했습니다.'
        });
    }
};

// 새 일정 생성
const createCalendarEvent = async (req, res) => {
    const { title, start, end, desc } = req.body;
    const userId = req.user.user_id; // userId -> user_id로 수정
    console.log('Creating event for user:', userId); // 디버깅용 로그

    if (!userId) {
        return res.status(400).json({
            success: false,
            error: 'user_id가 필요합니다.'
        });
    }

    if (!title || !start || !end) {
        return res.status(400).json({
            success: false,
            error: '제목, 시작 시간, 종료 시간은 필수 입력 항목입니다.'
        });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO calendar_events (title, start, end, description, user_id) VALUES (?, ?, ?, ?, ?)',
            [title, start, end, desc || '', userId]
        );

        const [newEvent] = await pool.query(
            'SELECT * FROM calendar_events WHERE id = ?',
            [result.insertId]
        );

        res.json({
            success: true,
            event: newEvent[0]
        });
    } catch (error) {
        console.error('일정 생성 실패:', error);
        res.status(500).json({
            success: false,
            error: '일정 생성에 실패했습니다.'
        });
    }
};

// 일정 수정
const updateCalendarEvent = async (req, res) => {
    const { eventId } = req.params;
    const { title, start, end, desc } = req.body;
    const userId = req.user.user_id; // userId -> user_id로 수정

    if (!userId) {
        return res.status(400).json({
            success: false,
            error: 'user_id가 필요합니다.'
        });
    }

    if (!eventId) {
        return res.status(400).json({
            success: false,
            error: 'event_id가 필요합니다.'
        });
    }

    if (!title || !start || !end) {
        return res.status(400).json({
            success: false,
            error: '제목, 시작 시간, 종료 시간은 필수 입력 항목입니다.'
        });
    }

    try {
        // 먼저 이벤트가 해당 사용자의 것인지 확인
        const [event] = await pool.query(
            'SELECT * FROM calendar_events WHERE id = ? AND user_id = ?',
            [eventId, userId]
        );

        if (!event.length) {
            return res.status(403).json({
                success: false,
                error: '해당 일정에 대한 권한이 없습니다.'
            });
        }

        await pool.query(
            'UPDATE calendar_events SET title = ?, start = ?, end = ?, description = ? WHERE id = ? AND user_id = ?',
            [title, start, end, desc || '', eventId, userId]
        );

        const [updatedEvent] = await pool.query(
            'SELECT * FROM calendar_events WHERE id = ?',
            [eventId]
        );

        res.json({
            success: true,
            event: updatedEvent[0]
        });
    } catch (error) {
        console.error('일정 수정 실패:', error);
        res.status(500).json({
            success: false,
            error: '일정 수정에 실패했습니다.'
        });
    }
};

// 일정 삭제
const deleteCalendarEvent = async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user.user_id; // userId -> user_id로 수정

    if (!userId) {
        return res.status(400).json({
            success: false,
            error: 'user_id가 필요합니다.'
        });
    }

    if (!eventId) {
        return res.status(400).json({
            success: false,
            error: 'event_id가 필요합니다.'
        });
    }

    try {
        // 먼저 이벤트가 해당 사용자의 것인지 확인
        const [event] = await pool.query(
            'SELECT * FROM calendar_events WHERE id = ? AND user_id = ?',
            [eventId, userId]
        );

        if (!event.length) {
            return res.status(403).json({
                success: false,
                error: '해당 일정에 대한 권한이 없습니다.'
            });
        }

        await pool.query('DELETE FROM calendar_events WHERE id = ? AND user_id = ?', [eventId, userId]);
        
        res.json({
            success: true
        });
    } catch (error) {
        console.error('일정 삭제 실패:', error);
        res.status(500).json({
            success: false,
            error: '일정 삭제에 실패했습니다.'
        });
    }
};

module.exports = {
    getCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent
}; 