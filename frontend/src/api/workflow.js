import { API_URL } from '../config';
import { getCurrentUserToken } from '../services/authService';

// 워크플로우 저장
export const saveWorkflow = async (workflowData) => {
  try {
    console.log('워크플로우 저장 시도:', workflowData);
    const token = getCurrentUserToken();
    
    const response = await fetch(`${API_URL}/workflow/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(workflowData)
    });

    console.log('워크플로우 저장 응답:', response);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '워크플로우 저장에 실패했습니다.');
    }

    return data;
  } catch (error) {
    console.error('워크플로우 저장 오류:', error);
    throw error;
  }
};

// 워크플로우 목록 조회
export const getWorkflowList = async () => {
  try {
    const token = getCurrentUserToken();
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
    }

    console.log('전체 워크플로우 목록 조회 시도...');
    const response = await fetch(`${API_URL}/workflow/list`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    console.log('전체 워크플로우 목록 응답:', data);
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
      }
      throw new Error(data.message || '워크플로우 목록 조회에 실패했습니다.');
    }

    return data;
  } catch (error) {
    console.error('워크플로우 목록 조회 오류:', error);
    throw error;
  }
};

// 워크플로우 불러오기
export const getWorkflowById = async (workflowId) => {
  try {
    const token = getCurrentUserToken();
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
    }

    if (!workflowId) {
      throw new Error('워크플로우 ID가 필요합니다.');
    }

    const response = await fetch(`${API_URL}/workflow/${workflowId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
      }
      throw new Error(data.message || '워크플로우 조회에 실패했습니다.');
    }

    return data;
  } catch (error) {
    console.error('워크플로우 조회 오류:', error);
    throw error;
  }
};

// 워크플로우 삭제
export const deleteWorkflow = async (workflowId) => {
  try {
    const token = getCurrentUserToken();
    const response = await fetch(`${API_URL}/workflow/${workflowId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '워크플로우 삭제에 실패했습니다.');
    }

    return data;
  } catch (error) {
    console.error('워크플로우 삭제 오류:', error);
    throw error;
  }
};

// 최근 워크플로우 조회
export const getRecentWorkflows = async () => {
  try {
    const token = getCurrentUserToken();
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
    }

    console.log('최근 워크플로우 조회 시도...');
    const response = await fetch(`${API_URL}/workflow/recent`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    console.log('최근 워크플로우 응답:', data);
    
    if (!response.ok) {
      const errorMessage = data.error || data.message || '최근 워크플로우 조회에 실패했습니다.';
      console.error('서버 응답 오류:', errorMessage);
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('최근 워크플로우 조회 오류:', error);
    throw error;
  }
}; 