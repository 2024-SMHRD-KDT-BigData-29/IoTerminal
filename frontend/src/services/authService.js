// 파일: frontend/src/services/authService.js

import axios from 'axios'; // axios import는 현재 이 파일에서는 직접 사용되지 않지만, 일반적으로 authService에서 사용할 수 있으므로 유지합니다.

// API 기본 URL (환경 변수 또는 기본값 사용)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// 로그인 함수
export const login = async (userId, password, keepLoggedIn = false) => {
    try {
        const response = await fetch(`${API_URL}/auth/login`, { // API_URL 변수 사용
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            // 서버에서 에러 메시지를 data.error로 보내는 경우도 고려 (백엔드 응답 형식에 따라 data.message 또는 data.error 등)
            throw new Error(data.message || data.error || '로그인에 실패했습니다.');
        }

        // 로그인 성공 시 토큰 및 사용자 정보 저장
        if (keepLoggedIn) {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token); // 'token' 키로 저장
        } else {
            sessionStorage.setItem('user', JSON.stringify(data.user));
            sessionStorage.setItem('token', data.token); // 'token' 키로 저장
        }
        
        // 로그인 성공 시, axios 인스턴스의 기본 헤더에도 토큰을 설정해 줄 수 있습니다 (선택 사항).
        // 하지만 일반적으로는 요청 인터셉터에서 처리합니다. (calendarService.js에서 이미 처리 중)
        // if (axios.defaults) { // axios가 전역적으로 사용되는 경우
        //   axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        // }

        return data; // { success: true, user: {...}, token: "..." } 형태의 응답으로 가정
    } catch (error) {
        console.error('로그인 서비스 오류:', error); // 콘솔 로그 메시지 명확화
        throw error; // 에러를 다시 throw하여 호출한 쪽에서 처리할 수 있도록 함
    }
};

// 회원가입 함수
export const register = async (userData) => {
    try {
        console.log('회원가입 요청 데이터 (authService):', userData);
        const response = await fetch(`${API_URL}/auth/register`, { // API_URL 변수 사용
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json' // 서버가 JSON을 반환할 것을 기대
            },
            // credentials: 'include', // CORS 상황에서 쿠키를 주고받을 때 필요. JWT 토큰 방식에서는 보통 불필요.
            body: JSON.stringify({
                userId: userData.userId,
                password: userData.password,
                name: userData.name,
                email: userData.email,
                phone: userData.phone || null // 빈 문자열 대신 null을 보낼 수 있도록 고려
            })
        });

        const contentType = response.headers.get('content-type');
        if (!response.ok) { // 응답이 성공적이지 않을 때 먼저 처리
            let errorData;
            if (contentType && contentType.includes('application/json')) {
                errorData = await response.json();
            }
            throw new Error(errorData?.message || errorData?.error || `회원가입 실패: ${response.statusText}`);
        }
        
        // 응답이 성공적이고 JSON 형식인지 확인
        if (!contentType || !contentType.includes('application/json')) {
            // 성공했지만 JSON이 아닌 경우 (예: 201 Created 후 빈 응답), 적절히 처리
            // 여기서는 JSON을 기대하므로, JSON이 아니면 에러로 간주하거나 빈 객체 반환 가능
            console.warn('서버 응답이 JSON 형식이 아니지만, 응답 코드는 성공적입니다.');
            return { success: true, message: "회원가입 요청은 성공했으나, 응답 데이터 형식을 확인해주세요." }; 
        }

        const data = await response.json();
        return data; // { success: true, message: "..." } 형태의 응답으로 가정
    } catch (error) {
        console.error('회원가입 서비스 오류:', error);
        throw error;
    }
};

// 현재 로그인된 사용자 정보 가져오기
export const getCurrentUserData = () => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error("사용자 정보 파싱 오류:", e);
            // 손상된 사용자 정보는 삭제하는 것이 좋을 수 있음
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            return null;
        }
    }
    return null;
};

// 현재 로그인된 사용자 토큰 가져오기 (수정된 함수)
export const getCurrentUserToken = () => {
    let token = localStorage.getItem('token'); // 1. localStorage에서 'token' 키로 먼저 찾아봅니다.
    if (!token) {
        token = sessionStorage.getItem('token'); // 2. localStorage에 없으면 sessionStorage에서 'token' 키로 찾아봅니다.
    }
    // 3. 수정된 함수임을 명시하고, 실제로 토큰을 찾는지 확인하는 로그
    console.log('[authService] getCurrentUserToken() (수정됨) is returning:', token ? `${token.substring(0,15)}...` : token); 
    return token;
};

// 로그아웃 함수
export const logout = () => {
    // 저장된 토큰 및 사용자 정보 삭제
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    // axios 인스턴스의 기본 헤더에서 토큰 제거 (선택 사항, calendarService.js에서 이미 인터셉터로 처리 중)
    // if (axios.defaults) {
    //   delete axios.defaults.headers.common['Authorization'];
    // }
    console.log('[authService] User logged out. Token and user data cleared.');
    // 필요하다면 로그인 페이지로 리다이렉트
    // window.location.href = '/login'; 
};

// 현재 로그인 상태인지 확인하는 함수
export const isAuthenticated = () => {
    // getCurrentUserToken 함수를 사용하여 토큰 존재 여부로 판단
    const tokenExists = !!getCurrentUserToken();
    console.log('[authService] isAuthenticated() check:', tokenExists);
    return tokenExists;
};