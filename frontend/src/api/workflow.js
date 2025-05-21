import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// 워크플로우 저장
export const saveWorkflow = async (workflowData) => {
  try {
    const response = await axios.post(`${API_URL}/workflow/save`, workflowData);
    return response.data;
  } catch (error) {
    console.error('워크플로우 저장 실패:', error);
    throw error;
  }
};

// 워크플로우 목록 조회
export const getWorkflowList = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/workflow/list`, {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    console.error('워크플로우 목록 조회 실패:', error);
    throw error;
  }
};

// 워크플로우 불러오기
export const getWorkflowById = async (workflowId) => {
  try {
    const response = await axios.get(`${API_URL}/workflow/${workflowId}`);
    return response.data;
  } catch (error) {
    console.error('워크플로우 불러오기 실패:', error);
    throw error;
  }
};

// 워크플로우 삭제
export const deleteWorkflow = async (workflowId) => {
  try {
    const response = await axios.delete(`${API_URL}/workflow/${workflowId}`);
    return response.data;
  } catch (error) {
    console.error('워크플로우 삭제 실패:', error);
    throw error;
  }
}; 