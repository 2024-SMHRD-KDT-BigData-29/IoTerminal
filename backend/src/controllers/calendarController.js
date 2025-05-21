const pool = require('../config/database');

// Helper function to format ISO string to MySQL DATETIME format 'YYYY-MM-DD HH:MM:SS'
// Example: '2025-05-21T15:00:00.000Z'  -> '2025-05-21 15:00:00'
const formatISOToMySQLDatetime = (isoString) => {
    if (!isoString) return null; // Handle null or undefined input gracefully
    try {
        const date = new Date(isoString);
        // Ensure the date is valid before formatting
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date string received: ${isoString}`);
            return null; // Or throw an error, or return original string if DB handles some flexibility
        }
        // Slice to get 'YYYY-MM-DDTHH:MM:SS', then replace 'T' with a space.
        return date.toISOString().slice(0, 19).replace('T', ' ');
    } catch (e) {
        console.warn(`Error formatting date string ${isoString}:`, e);
        return null; // Or handle error as appropriate
    }
};


// 사용자의 일정 목록 조회
const getCalendarEvents = async (req, res) => {
    const userId = req.user.user_id;
    console.log('Request user for getCalendarEvents:', req.user);

    if (!userId) {
        return res.status(400).json({
            success: false,
            error: 'user_id가 필요합니다.'
        });
    }

    try {
        const [events] = await pool.query(
            'SELECT id, title, start, end, description, user_id FROM calendar_events WHERE user_id = ? ORDER BY start ASC', // 명시적으로 컬럼 선택
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

// 새 일정 생성 (수정된 부분)
const createCalendarEvent = async (req, res) => {
    let { title, start, end, desc } = req.body; // let으로 변경하여 재할당 가능하도록
    const userId = req.user.user_id;
    console.log('Creating event for user:', userId, 'Original start:', start, 'Original end:', end);

    if (!userId) {
        return res.status(400).json({ success: false, error: 'user_id가 필요합니다.' });
    }
    if (!title || !start || !end) {
        return res.status(400).json({ success: false, error: '제목, 시작 시간, 종료 시간은 필수 입력 항목입니다.' });
    }

    // 날짜 형식 변환
    const formattedStart = formatISOToMySQLDatetime(start);
    const formattedEnd = formatISOToMySQLDatetime(end);

    if (!formattedStart || !formattedEnd) {
        return res.status(400).json({ success: false, error: '날짜 형식이 올바르지 않습니다.' });
    }
    
    console.log('Formatted start:', formattedStart, 'Formatted end:', formattedEnd);


    try {
        const [result] = await pool.query(
            'INSERT INTO calendar_events (title, start, end, description, user_id) VALUES (?, ?, ?, ?, ?)',
            [title, formattedStart, formattedEnd, desc || null, userId] // desc가 없으면 '' 대신 NULL
        );

        const [newEvent] = await pool.query(
            'SELECT id, title, start, end, description, user_id FROM calendar_events WHERE id = ?', // 명시적으로 컬럼 선택
            [result.insertId]
        );

        res.status(201).json({ // 생성 성공 시 201 Created 상태 코드
            success: true,
            event: newEvent[0]
        });
    } catch (error) {
        console.error('일정 생성 실패:', error);
        res.status(500).json({
            success: false,
            error: '일정 생성에 실패했습니다.',
            details: error.message // 에러 상세 정보 추가 (개발 시 유용)
        });
    }
};

// 일정 수정 (수정된 부분)
const updateCalendarEvent = async (req, res) => {
    const { eventId } = req.params;
    let { title, start, end, desc } = req.body; // let으로 변경
    const userId = req.user.user_id;

    if (!userId) {
        return res.status(400).json({ success: false, error: 'user_id가 필요합니다.' });
    }
    if (!eventId) {
        return res.status(400).json({ success: false, error: 'event_id가 필요합니다.' });
    }
    if (!title || !start || !end) {
        return res.status(400).json({ success: false, error: '제목, 시작 시간, 종료 시간은 필수 입력 항목입니다.' });
    }

    // 날짜 형식 변환
    const formattedStart = formatISOToMySQLDatetime(start);
    const formattedEnd = formatISOToMySQLDatetime(end);

    if (!formattedStart || !formattedEnd) {
        return res.status(400).json({ success: false, error: '날짜 형식이 올바르지 않습니다.' });
    }

    try {
        const [eventCheck] = await pool.query( // 변수명 변경 (event는 예약어와 혼동 가능성)
            'SELECT id FROM calendar_events WHERE id = ? AND user_id = ?', // id만 가져와도 충분
            [eventId, userId]
        );

        if (!eventCheck.length) {
            return res.status(403).json({ success: false, error: '해당 일정에 대한 권한이 없거나 일정이 존재하지 않습니다.' });
        }

        await pool.query(
            'UPDATE calendar_events SET title = ?, start = ?, end = ?, description = ? WHERE id = ? AND user_id = ?',
            [title, formattedStart, formattedEnd, desc || null, eventId, userId]
        );

        const [updatedEvent] = await pool.query(
            'SELECT id, title, start, end, description, user_id FROM calendar_events WHERE id = ?', // 명시적으로 컬럼 선택
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
            error: '일정 수정에 실패했습니다.',
            details: error.message
        });
    }
};

// 일정 삭제 (기존 코드 유지 가능, 필요시 userId, eventId 타입 변환 등 추가 검토)
const deleteCalendarEvent = async (req, res) => {
    const eventId = parseInt(req.params.eventId, 10); // eventId를 숫자로 변환 (URL 파라미터는 문자열)
    const userId = req.user.user_id;

    if (!userId) {
        return res.status(400).json({ success: false, error: 'user_id가 필요합니다.' });
    }
    if (isNaN(eventId)) { // 숫자로 변환되지 않으면 유효하지 않은 ID
        return res.status(400).json({ success: false, error: '유효한 event_id가 필요합니다.' });
    }

    try {
        const [eventCheck] = await pool.query(
            'SELECT id FROM calendar_events WHERE id = ? AND user_id = ?',
            [eventId, userId]
        );

        if (!eventCheck.length) {
            return res.status(403).json({ success: false, error: '해당 일정에 대한 권한이 없거나 일정이 존재하지 않습니다.' });
        }

        const [deleteResult] = await pool.query( // 삭제 결과 받기
            'DELETE FROM calendar_events WHERE id = ? AND user_id = ?', 
            [eventId, userId]
        );

        if (deleteResult.affectedRows === 0) { // 실제로 삭제된 행이 없을 경우 (위에서 이미 체크했지만, 한번 더 확인)
            return res.status(404).json({ success: false, error: '일정을 찾을 수 없거나 이미 삭제되었습니다.' });
        }
        
        res.json({
            success: true,
            message: '일정이 성공적으로 삭제되었습니다.' // 메시지 추가
        });
    } catch (error) {
        console.error('일정 삭제 실패:', error);
        res.status(500).json({
            success: false,
            error: '일정 삭제에 실패했습니다.',
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