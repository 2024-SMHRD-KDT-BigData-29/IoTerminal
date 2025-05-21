import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const login = async (userId, password, keepLoggedIn = false) => {
    try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '로그인에 실패했습니다.');
        }

        // 로그인 유지 여부에 따라 저장소 선택
        if (keepLoggedIn) {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
        } else {
            sessionStorage.setItem('user', JSON.stringify(data.user));
            sessionStorage.setItem('token', data.token);
        }
        
        return data;
    } catch (error) {
        console.error('로그인 오류:', error);
        throw error;
    }
};

export const register = async (userData) => {
    try {
        console.log('회원가입 요청 데이터:', userData);
        const response = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                userId: userData.userId,
                password: userData.password,
                name: userData.name,
                email: userData.email,
                phone: userData.phone || ''
            })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('서버 응답이 JSON 형식이 아닙니다.');
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '회원가입에 실패했습니다.');
        }

        return data;
    } catch (error) {
        console.error('회원가입 오류:', error);
        throw error;
    }
};

export const getCurrentUserData = () => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
        return JSON.parse(userStr);
    }
    return null;
};

export const getCurrentUserToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
};

export const isAuthenticated = () => {
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
}; 