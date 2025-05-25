// 데이터 분석 관련 API 서비스

import api from './api';

// 기기별 사용량 데이터 가져오기
export const getDeviceUsageData = async (deviceId, dateRange) => {
    try {
        const response = await api.get(`/devices/${deviceId}/analytics/usage`, {
            params: {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            }
        });
        return response.data;
    } catch (error) {
        console.error('사용량 데이터 조회 실패:', error);
        throw error;
    }
};

// 기기별 센서 데이터 가져오기
export const getDeviceSensorData = async (deviceId, dateRange) => {
    try {
        const response = await api.get(`/devices/${deviceId}/analytics/sensor`, {
            params: {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            }
        });
        return response.data;
    } catch (error) {
        console.error('센서 데이터 조회 실패:', error);
        throw error;
    }
};

// 기기별 이벤트 로그 가져오기
export const getDeviceEventLogs = async (deviceId, dateRange) => {
    try {
        const response = await api.get(`/devices/${deviceId}/analytics/events`, {
            params: {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            }
        });
        return response.data;
    } catch (error) {
        console.error('이벤트 로그 조회 실패:', error);
        throw error;
    }
};

// 기기별 성능 통계 가져오기
export const getDevicePerformanceStats = async (deviceId, dateRange) => {
    try {
        const response = await api.get(`/devices/${deviceId}/analytics/performance`, {
            params: {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            }
        });
        return response.data;
    } catch (error) {
        console.error('성능 통계 조회 실패:', error);
        throw error;
    }
};

// 사용 패턴 분석 데이터 가져오기
export const getUsagePatternData = async (deviceId, dateRange) => {
    try {
        const response = await api.get(`/devices/${deviceId}/analytics`, {
            params: {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            }
        });

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
        const response = await api.get(`/devices/${deviceId}/analytics`, {
            params: {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            }
        });

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
        const response = await api.get(`/devices/${deviceId}/insights`);
        return response.data.insights || [];
    } catch (error) {
        console.error('인사이트 데이터 조회 실패:', error);
        throw error;
    }
}; 