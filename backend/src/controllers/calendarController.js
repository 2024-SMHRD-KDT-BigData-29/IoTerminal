// 파일: backend/src/controllers/calendarController.js

const pool = require('../config/database');

// Helper function to format ISO string to MySQL DATETIME format 'YYYY-MM-DD HH:MM:SS'
// Example: '2025-05-21T15:00:00.000Z'  -> '2025-05-21 15:00:00'
const formatISOToMySQLDatetime = (isoString) => {
    if (!isoString) return null;
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date string received for formatting: ${isoString}`);
            return null;
        }
        return date.toISOString().slice(0, 19).replace('T', ' ');
    } catch (e) {
        console.warn(`Error formatting date string ${isoString}:`, e);
        return null;
    }
};

// 사용자의 일정 목록 조회
const getCalendarEvents = async (req, res) => {
    const userId = req.user.user_id;
    console.log('[CalendarController] Getting events for user:', userId, 'User object from token:', req.user);

    if (!userId) {
        return res.status(400).json({
            success: false,
            error: 'user_id가 필요합니다. 사용자가 인증되지 않았을 수 있습니다.'
        });
    }

    try {
        const [events] = await pool.query(
            'SELECT id, title, start, end, description, user_id FROM calendar_events WHERE user_id = ? ORDER BY start ASC',
            [userId]
        );

        res.json({
            success: true,
            events
        });
    } catch (error) {
        console.error('[CalendarController] 일정 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '일정 조회 중 서버 오류가 발생했습니다.'
        });
    }
};

// 새 일정 생성
const createCalendarEvent = async (req, res) => {
    const { title, start, end, description } = req.body; // 'desc' 대신 'description' 사용
    const userId = req.user.user_id;
    
    console.log('[CalendarController] Creating event for user:', userId);
    console.log('[CalendarController] Received body for create:', req.body);


    if (!userId) {
        return res.status(400).json({ success: false, error: 'user_id가 필요합니다. 사용자가 인증되지 않았을 수 있습니다.' });
    }
    if (!title || !start || !end) {
        return res.status(400).json({ success: false, error: '제목, 시작 시간, 종료 시간은 필수 입력 항목입니다.' });
    }

    const formattedStart = formatISOToMySQLDatetime(start);
    const formattedEnd = formatISOToMySQLDatetime(end);

    if (!formattedStart || !formattedEnd) {
        return res.status(400).json({ success: false, error: '날짜 형식이 올바르지 않습니다. ISO 문자열 형식을 사용해주세요.' });
    }
    
    console.log('[CalendarController] Formatted start for DB:', formattedStart);
    console.log('[CalendarController] Formatted end for DB:', formattedEnd);

    try {
        const [result] = await pool.query(
            'INSERT INTO calendar_events (title, start, end, description, user_id) VALUES (?, ?, ?, ?, ?)',
            [title, formattedStart, formattedEnd, description || null, userId]
        );

        const [newEvent] = await pool.query(
            'SELECT id, title, start, end, description, user_id FROM calendar_events WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: '일정이 성공적으로 생성되었습니다.',
            event: newEvent[0]
        });
    } catch (error) {
        console.error('[CalendarController] 일정 생성 실패:', error);
        res.status(500).json({
            success: false,
            error: '일정 생성 중 서버 오류가 발생했습니다.',
            details: error.message 
        });
    }
};

// 일정 수정
const updateCalendarEvent = async (req, res) => {
    const eventId = parseInt(req.params.eventId, 10);
    const { title, start, end, description } = req.body; // 'desc' 대신 'description' 사용
    const userId = req.user.user_id;

    console.log('[CalendarController] Updating event for user:', userId, 'Event ID:', eventId);
    console.log('[CalendarController] Received body for update:', req.body);


    if (!userId) {
        return res.status(400).json({ success: false, error: 'user_id가 필요합니다. 사용자가 인증되지 않았을 수 있습니다.' });
    }
    if (isNaN(eventId)) {
        return res.status(400).json({ success: false, error: '유효한 event_id가 필요합니다.' });
    }
    if (!title || !start || !end) {
        return res.status(400).json({ success: false, error: '제목, 시작 시간, 종료 시간은 필수 입력 항목입니다.' });
    }

    const formattedStart = formatISOToMySQLDatetime(start);
    const formattedEnd = formatISOToMySQLDatetime(end);

    if (!formattedStart || !formattedEnd) {
        return res.status(400).json({ success: false, error: '날짜 형식이 올바르지 않습니다. ISO 문자열 형식을 사용해주세요.' });
    }

    console.log('[CalendarController] Formatted start for DB update:', formattedStart);
    console.log('[CalendarController] Formatted end for DB update:', formattedEnd);

    try {
        const [eventCheck] = await pool.query(
            'SELECT id FROM calendar_events WHERE id = ? AND user_id = ?',
            [eventId, userId]
        );

        if (eventCheck.length === 0) {
            return res.status(403).json({ success: false, error: '해당 일정에 대한 수정 권한이 없거나 일정이 존재하지 않습니다.' });
        }

        await pool.query(
            'UPDATE calendar_events SET title = ?, start = ?, end = ?, description = ? WHERE id = ? AND user_id = ?',
            [title, formattedStart, formattedEnd, description || null, eventId, userId]
        );

        const [updatedEvent] = await pool.query(
            'SELECT id, title, start, end, description, user_id FROM calendar_events WHERE id = ?',
            [eventId]
        );

        res.json({
            success: true,
            message: '일정이 성공적으로 수정되었습니다.',
            event: updatedEvent[0]
        });
    } catch (error) {
        console.error('[CalendarController] 일정 수정 실패:', error);
        res.status(500).json({
            success: false,
            error: '일정 수정 중 서버 오류가 발생했습니다.',
            details: error.message
        });
    }
};

// 일정 삭제
const deleteCalendarEvent = async (req, res) => {
    const eventId = parseInt(req.params.eventId, 10);
    const userId = req.user.user_id;

    console.log('[CalendarController] Deleting event for user:', userId, 'Event ID:', eventId);

    if (!userId) {
        return res.status(400).json({ success: false, error: 'user_id가 필요합니다. 사용자가 인증되지 않았을 수 있습니다.' });
    }
    if (isNaN(eventId)) {
        return res.status(400).json({ success: false, error: '유효한 event_id가 필요합니다.' });
    }

    try {
        const [eventCheck] = await pool.query(
            'SELECT id FROM calendar_events WHERE id = ? AND user_id = ?',
            [eventId, userId]
        );

        if (eventCheck.length === 0) {
            return res.status(403).json({ success: false, error: '해당 일정에 대한 삭제 권한이 없거나 일정이 존재하지 않습니다.' });
        }

        const [deleteResult] = await pool.query(
            'DELETE FROM calendar_events WHERE id = ? AND user_id = ?', 
            [eventId, userId]
        );

        if (deleteResult.affectedRows === 0) {
            // 이 경우는 위에서 이미 eventCheck로 걸렀어야 하지만, 만약의 경우를 대비
            return res.status(404).json({ success: false, error: '일정을 찾을 수 없거나 이미 삭제된 것 같습니다.' });
        }
        
        res.json({
            success: true,
            message: '일정이 성공적으로 삭제되었습니다.'
        });
    } catch (error) {
        console.error('[CalendarController] 일정 삭제 실패:', error);
        res.status(500).json({
            success: false,
            error: '일정 삭제 중 서버 오류가 발생했습니다.',
            details: error.message
        });
    }
};

module.exports = {
    getCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent
};