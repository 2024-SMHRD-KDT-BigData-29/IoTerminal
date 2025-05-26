/**
 * @file authService.js
 * @description 인증 관련 서비스 함수들을 제공합니다.
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * 로그인 처리를 수행합니다.
 * @param {string} userId - 사용자 아이디
 * @param {string} password - 사용자 비밀번호
 * @param {boolean} keepLoggedIn - 로그인 상태 유지 여부
 * @returns {Promise<Object>} 로그인 결과
 * @throws {Error} 로그인 실패 시 에러
 */
export const login = async (userId, password, keepLoggedIn = false) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, { userId, password });
        
        const data = response.data;
        const storage = keepLoggedIn ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(data.user));
        storage.setItem('token', data.token);

        return data;
    } catch (error) {
        console.error('로그인 오류:', error);
        throw error.response?.data || error;
    }
};

/**
 * 회원가입을 처리합니다.
 * @param {Object} userData - 사용자 정보
 * @returns {Promise<Object>} 회원가입 결과
 * @throws {Error} 회원가입 실패 시 에러
 */
export const register = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/auth/register`, {
            userId: userData.userId,
            password: userData.password,
            name: userData.name,
            email: userData.email,
            phone: userData.phone || null,
            gender: userData.gender || null,
            birth_date: userData.birthdate ? userData.birthdate.toISOString().split('T')[0] : null,
            address: userData.address || null
        });

        return response.data;
    } catch (error) {
        console.error('회원가입 오류:', error);
        throw error.response?.data || error;
    }
};

/**
 * 현재 로그인된 사용자 정보를 반환합니다.
 * @returns {Object|null} 사용자 정보 또는 null
 */
export const getCurrentUserData = () => {
    try {
        const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('사용자 정보 파싱 오류:', error);
        return null;
    }
};

/**
 * 현재 로그인된 사용자의 토큰을 반환합니다.
 * @returns {string|null} 토큰 또는 null
 */
export const getCurrentUserToken = () => {
    try {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    } catch (error) {
        console.error('토큰 조회 오류:', error);
        return null;
    }
};

/**
 * 로그아웃 처리를 수행합니다.
 */
export const logout = () => {
    try {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
    } catch (error) {
        console.error('로그아웃 처리 오류:', error);
    }
};

/**
 * 현재 로그인 상태를 확인합니다.
 * @returns {boolean} 로그인 상태 여부
 */
export const isAuthenticated = () => {
    return !!getCurrentUserToken();
};

export const updateUserInfo = async (userData) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return axios.put(`${API_URL}/users/update`, userData, {
    headers: { Authorization: `Bearer ${token}` }
  });
};