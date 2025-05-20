export const login = async (username, password) => {
    // 더미 로그인: 아무 username/password나 통과
    return Promise.resolve({
        message: '로그인 성공',
        token: 'dummy-token',
        user: { username, name: username, email: username + '@example.com' }
    });
};

export const register = async (username, password) => {
    return Promise.resolve({
        message: '회원가입 성공',
        userId: Date.now().toString()
    });
};

export const getCurrentUserToken = () => {
    return 'dummy-token';
};

export const getCurrentUserData = () => {
    return { username: '사용자', name: '사용자', email: 'user@example.com' };
};

export const logout = () => {
    // 더미 로그아웃
    return Promise.resolve();
}; 