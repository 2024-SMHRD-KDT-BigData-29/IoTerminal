// 데이터 분석 관련 API 서비스

// 기기별 사용량 데이터 가져오기
export const getDeviceUsageData = async (deviceId, timeRange) => {
    try {
        const response = await fetch(`http://localhost:3001/api/analysis/usage/${deviceId}?timeRange=${timeRange}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('데이터를 가져오는데 실패했습니다.');
        }

        return await response.json();
    } catch (error) {
        console.error('사용량 데이터 조회 오류:', error);
        throw error;
    }
};

// 사용 패턴 분석 데이터 가져오기
export const getUsagePatternData = async (deviceId, timeRange) => {
    try {
        const response = await fetch(`http://localhost:3001/api/analysis/pattern/${deviceId}?timeRange=${timeRange}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('패턴 데이터를 가져오는데 실패했습니다.');
        }

        return await response.json();
    } catch (error) {
        console.error('패턴 데이터 조회 오류:', error);
        throw error;
    }
};

// 효율성 분석 데이터 가져오기
export const getEfficiencyData = async (deviceId, timeRange) => {
    try {
        const response = await fetch(`http://localhost:3001/api/analysis/efficiency/${deviceId}?timeRange=${timeRange}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('효율성 데이터를 가져오는데 실패했습니다.');
        }

        return await response.json();
    } catch (error) {
        console.error('효율성 데이터 조회 오류:', error);
        throw error;
    }
};

// 인사이트 데이터 가져오기
export const getInsightsData = async (deviceId) => {
    try {
        const response = await fetch(`http://localhost:3001/api/analysis/insights/${deviceId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('인사이트 데이터를 가져오는데 실패했습니다.');
        }

        return await response.json();
    } catch (error) {
        console.error('인사이트 데이터 조회 오류:', error);
        throw error;
    }
}; 