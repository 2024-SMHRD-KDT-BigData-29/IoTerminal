export const getDashboardSummary = async () => {
    return Promise.resolve({
        activeSensors: 3,
        dataCollected: "1,200",
        errorRate: "0.5%",
        apiCalls: "0"
    });
};

export const getSensorStatuses = async () => {
    return Promise.resolve([
        { name: '온도 센서', status: '정상', value: '23.5°C' },
        { name: '습도 센서', status: '정상', value: '45%' },
        { name: '전류 센서', status: '주의', value: '2.4A' }
    ]);
};

export const getRecentWorkflowsForDashboard = async () => {
    return Promise.resolve([
        { name: '온도 모니터링', time: '10분 전', status: '실행 중', statusColor: 'green' },
        { name: '데이터 수집', time: '1시간 전', status: '완료', statusColor: 'green' }
    ]);
};

export const getApiStatusesForDashboard = async () => {
    return Promise.resolve([
        { name: '네이버 클라우드', status: '연결됨', statusColor: 'green', calls: '2.3K' },
        { name: '카카오톡 알림', status: '연결됨', statusColor: 'green', calls: '847' },
        { name: '토스 결제', status: '인증 필요', statusColor: 'yellow', calls: '0' },
        { name: '공공 데이터 포털', status: '연결됨', statusColor: 'green', calls: '1.1K' }
    ]);
}; 