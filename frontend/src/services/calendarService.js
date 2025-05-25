import api from './api';

// 인증/권한 오류 처리 함수
function handleAuthError(error) {
    if (error.response?.status === 401) {
        throw { 
            authError: true, 
            message: '인증이 만료되었습니다. 다시 로그인해주세요.' 
        };
    }
    if (error.response?.status === 403) {
        throw { 
            authError: true, 
            message: '일정 조회 권한이 없습니다. 관리자에게 문의하세요.' 
        };
    }
    return false;
}

export const getCalendarEvents = async () => {
    try {
        const response = await api.get('/calendar/events');
        return response.data;
    } catch (error) {
        handleAuthError(error);
        console.error('일정 조회 실패:', error.response?.data || error.message);
        throw {
            message: '일정을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.',
            error: error
        };
    }
};

export const createCalendarEvent = async (eventData) => {
    try {
        const response = await api.post('/calendar/events', eventData);
        return response.data;
    } catch (error) {
        handleAuthError(error);
        console.error('일정 생성 실패:', error);
        throw {
            message: '일정 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
            error: error
        };
    }
};

export const updateCalendarEvent = async (eventId, eventData) => {
    try {
        const response = await api.put(`/calendar/events/${eventId}`, eventData);
        return response.data;
    } catch (error) {
        handleAuthError(error);
        console.error('일정 수정 실패:', error);
        throw {
            message: '일정 수정에 실패했습니다. 잠시 후 다시 시도해주세요.',
            error: error
        };
    }
};

export const deleteCalendarEvent = async (eventId) => {
    try {
        const response = await api.delete(`/calendar/events/${eventId}`);
        return response.data;
    } catch (error) {
        handleAuthError(error);
        console.error('일정 삭제 실패:', error);
        throw {
            message: '일정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.',
            error: error
        };
    }
}; 