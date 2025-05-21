import axios from 'axios';
import { getCurrentUserToken } from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// axios 인스턴스 생성
const api = axios.create({
    baseURL: API_URL
});

// 요청 인터셉터 추가
api.interceptors.request.use(
    (config) => {
        const token = getCurrentUserToken(); // authService에서 이 함수를 호출

        // 추가된 로그들
        console.log('[AxiosInterceptor] Token from getCurrentUserToken():', token); 

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log('[AxiosInterceptor] Authorization header SET TO:', config.headers['Authorization']);
        } else {
            console.log('[AxiosInterceptor] Token is falsy (null, undefined, empty string). Authorization header NOT SET.');
        }
        // console.log('[AxiosInterceptor] Final outgoing config.headers:', config.headers); // 필요시 전체 헤더 확인
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

function handleAuthError(error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
        // 자동 로그아웃/리다이렉트 제거, 대신 특별한 에러 객체 반환
        return true;
    }
    return false;
}

export const getCalendarEvents = async () => {
    try {
        const response = await api.get('/calendar/events');
        return response.data;
    } catch (error) {
        if (handleAuthError(error)) {
            throw { authError: true };
        }
        console.error('일정 조회 실패:', error.response?.data || error.message);
        throw error;
    }
};

export const createCalendarEvent = async (eventData) => {
    try {
        const token = getCurrentUserToken();
        if (!token) {
            const error = new Error('인증 토큰이 없습니다.');
            error.authError = true;
            throw error;
        }

        const response = await fetch(`${API_URL}/calendar/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(eventData)
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                const error = new Error('인증이 필요합니다.');
                error.authError = true;
                throw error;
            }
            const errorData = await response.json();
            throw new Error(errorData.error || '일정 생성에 실패했습니다.');
        }

        return await response.json();
    } catch (error) {
        console.error('일정 생성 실패:', error);
        throw error;
    }
};

export const updateCalendarEvent = async (eventId, eventData) => {
    try {
        const token = getCurrentUserToken();
        if (!token) {
            const error = new Error('인증 토큰이 없습니다.');
            error.authError = true;
            throw error;
        }

        const response = await fetch(`${API_URL}/calendar/events/${eventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(eventData)
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                const error = new Error('인증이 필요합니다.');
                error.authError = true;
                throw error;
            }
            const errorData = await response.json();
            throw new Error(errorData.error || '일정 수정에 실패했습니다.');
        }

        return await response.json();
    } catch (error) {
        console.error('일정 수정 실패:', error);
        throw error;
    }
};

export const deleteCalendarEvent = async (eventId) => {
    try {
        const token = getCurrentUserToken();
        if (!token) {
            const error = new Error('인증 토큰이 없습니다.');
            error.authError = true;
            throw error;
        }

        const response = await fetch(`${API_URL}/calendar/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                const error = new Error('인증이 필요합니다.');
                error.authError = true;
                throw error;
            }
            const errorData = await response.json();
            throw new Error(errorData.error || '일정 삭제에 실패했습니다.');
        }

        return await response.json();
    } catch (error) {
        console.error('일정 삭제 실패:', error);
        throw error;
    }
}; 