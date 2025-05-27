import api from './api';

// 센서 등록
export const createSensor = async (sensor) => {
  return api.post('/sensors', sensor);
};

// 센서 전체 조회
export const getSensors = async () => {
  const res = await api.get('/sensors');
  return res.data.sensors;
};

// 센서 정보(이름 등) 수정
export const updateSensor = async (sensor_id, data) => {
  return api.put(`/sensors/${sensor_id}`, data);
}; 