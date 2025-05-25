import api from './api';

// 사용자의 디바이스 목록 가져오기
export const getUserDevices = async () => {
    try {
        const response = await api.get('/devices/list');
        return response.data.devices || [];
    } catch (error) {
        console.error('디바이스 목록 조회 오류:', error);
        throw error;
    }
};

// 디바이스 상태 가져오기
export const getDeviceStatus = async (deviceId) => {
    try {
        const response = await api.get(`/devices/${deviceId}/status`);
        return response.data.status || {};
    } catch (error) {
        console.error('디바이스 상태 조회 오류:', error);
        throw error;
    }
}; 