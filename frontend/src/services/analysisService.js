// 데이터 분석 관련 API 서비스

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * 디바이스 사용량 분석 데이터를 가져옵니다.
 * @param {string} deviceId - 디바이스 ID
 * @param {Object} dateRange - 날짜 범위 {startDate, endDate}
 * @returns {Promise<Object>} 사용량 분석 데이터
 */
export const getDeviceUsageData = async (deviceId, dateRange) => {
    try {
        const params = new URLSearchParams();
        if (dateRange.startDate) params.append('startDate', dateRange.startDate);
        if (dateRange.endDate) params.append('endDate', dateRange.endDate);
        
        const response = await axios.get(`${API_URL}/analysis/usage/${deviceId}?${params}`);
        return response.data;
    } catch (error) {
        console.error('사용량 분석 데이터 조회 오류:', error);
        throw error;
    }
};

/**
 * 디바이스 센서 데이터 분석을 가져옵니다.
 * @param {string} deviceId - 디바이스 ID
 * @param {Object} dateRange - 날짜 범위 {startDate, endDate}
 * @returns {Promise<Object>} 센서 데이터 분석
 */
export const getDeviceSensorData = async (deviceId, dateRange) => {
    try {
        const params = new URLSearchParams();
        if (dateRange.startDate) params.append('startDate', dateRange.startDate);
        if (dateRange.endDate) params.append('endDate', dateRange.endDate);
        
        const response = await axios.get(`${API_URL}/analysis/sensor/${deviceId}?${params}`);
        return response.data;
    } catch (error) {
        console.error('센서 데이터 분석 조회 오류:', error);
        throw error;
    }
};

/**
 * 디바이스 이벤트 로그 분석을 가져옵니다.
 * @param {string} deviceId - 디바이스 ID
 * @param {Object} dateRange - 날짜 범위 {startDate, endDate}
 * @returns {Promise<Object>} 이벤트 로그 분석
 */
export const getDeviceEventLogs = async (deviceId, dateRange) => {
    try {
        const params = new URLSearchParams();
        if (dateRange.startDate) params.append('startDate', dateRange.startDate);
        if (dateRange.endDate) params.append('endDate', dateRange.endDate);
        
        const response = await axios.get(`${API_URL}/analysis/events/${deviceId}?${params}`);
        return response.data;
    } catch (error) {
        console.error('이벤트 로그 분석 조회 오류:', error);
        throw error;
    }
};

/**
 * 디바이스 성능 통계를 가져옵니다.
 * @param {string} deviceId - 디바이스 ID
 * @param {Object} dateRange - 날짜 범위 {startDate, endDate}
 * @returns {Promise<Object>} 성능 통계
 */
export const getDevicePerformanceStats = async (deviceId, dateRange) => {
    try {
        const params = new URLSearchParams();
        if (dateRange.startDate) params.append('startDate', dateRange.startDate);
        if (dateRange.endDate) params.append('endDate', dateRange.endDate);
        
        const response = await axios.get(`${API_URL}/analysis/performance/${deviceId}?${params}`);
        return response.data;
    } catch (error) {
        console.error('성능 통계 조회 오류:', error);
        throw error;
    }
};

// 사용 패턴 분석 데이터 가져오기
export const getUsagePatternData = async (deviceId, dateRange) => {
    try {
        const response = await axios.get(`${API_URL}/analysis/usage/${deviceId}?${params}`);

        const data = response.data;
        const hourlyData = new Array(24).fill(0);
        
        // 시간대별 사용량 집계
        data.rawData.forEach(item => {
            const hour = new Date(item.timestamp).getHours();
            hourlyData[hour] += item.status.usage || 0;
        });

        return {
            labels: Array.from({length: 24}, (_, i) => `${i}시`),
            datasets: [
                {
                    label: '시간대별 사용량',
                    data: hourlyData,
                    backgroundColor: '#b39ddb'
                }
            ]
        };
    } catch (error) {
        console.error('사용 패턴 데이터 조회 실패:', error);
        throw error;
    }
};

// 효율성 분석 데이터 가져오기
export const getEfficiencyData = async (deviceId, dateRange) => {
    try {
        const response = await axios.get(`${API_URL}/analysis/efficiency/${deviceId}?${params}`);

        const data = response.data;
        
        // 효율성 데이터 계산
        const totalUsage = data.rawData.reduce((sum, item) => sum + (item.status.usage || 0), 0);
        const optimalUsage = data.rawData.length * 100; // 예시: 최적 사용량을 100으로 가정
        const efficiency = (totalUsage / optimalUsage) * 100;

        return {
            labels: ['효율적 사용', '비효율적 사용'],
            datasets: [
                {
                    data: [efficiency, 100 - efficiency],
                    backgroundColor: ['#7e57c2', '#e0e0e0']
                }
            ]
        };
    } catch (error) {
        console.error('효율성 데이터 조회 실패:', error);
        throw error;
    }
};

// 인사이트 데이터 가져오기
export const getInsightsData = async (deviceId) => {
    try {
        const response = await axios.get(`${API_URL}/devices/${deviceId}/insights`);
        return response.data.insights || [];
    } catch (error) {
        console.error('인사이트 데이터 조회 실패:', error);
        throw error;
    }
}; 