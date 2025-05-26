import api from './api';
import axios from 'axios';

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

// 디바이스에 센서 연결
export const linkSensorToDevice = async (device_id, sensor_id, config) => {
  return api.post('/device-sensors/link', { device_id, sensor_id, config });
};

// 디바이스에 연결된 센서 목록 조회
export const getDeviceSensors = async (deviceId) => {
  const res = await api.get(`/device-sensors/${deviceId}`);
  return res.data.sensors;
};

export const createDevice = async (data) => {
    const res = await api.post('/devices', data);
    return res.data;
}; 