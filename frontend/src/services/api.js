import axios from 'axios';

// API 기본 설정
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// 요청 인터셉터 - 토큰 추가
api.interceptors.request.use(
    (config) => {
        // localStorage와 sessionStorage 모두에서 토큰 확인
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.warn('No authentication token found');
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response) {
            // 서버가 응답을 반환한 경우
            switch (error.response.status) {
                case 401:
                    // 인증 오류 처리
                    const errorMessage = error.response.data?.message || '인증이 만료되었습니다.';
                    console.error('인증 오류:', errorMessage);
                    // 토큰 삭제
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('token');
                    localStorage.removeItem('user');
                    sessionStorage.removeItem('user');
                    // 현재 페이지가 로그인 페이지가 아닌 경우에만 리다이렉트
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                    break;
                case 403:
                    // 권한 오류 처리
                    console.error('접근 권한이 없습니다:', error.response.data?.message);
                    error.authError = true;
                    break;
                default:
                    console.error('API 요청 중 오류가 발생했습니다:', error.response.data);
            }
        } else if (error.request) {
            // 요청은 보냈지만 응답을 받지 못한 경우
            console.error('서버로부터 응답을 받지 못했습니다.');
            error.message = '서버와의 통신이 원활하지 않습니다. 잠시 후 다시 시도해주세요.';
        } else {
            // 요청 설정 중 오류가 발생한 경우
            console.error('API 요청 설정 중 오류가 발생했습니다:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api; 