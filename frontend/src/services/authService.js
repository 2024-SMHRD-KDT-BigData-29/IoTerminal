export const login = async (username, password) => {
    // 더미 로그인: 아무 username/password나 통과
    return Promise.resolve({
        message: '로그인 성공',
        token: 'dummy-token',
        user: { username, name: username, email: username + '@example.com' }
    });
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

export const getCurrentUserToken = () => {
    return localStorage.getItem('token');
};

export const getCurrentUserData = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const logout = () => {
    // 더미 로그아웃
    return Promise.resolve();
}; 