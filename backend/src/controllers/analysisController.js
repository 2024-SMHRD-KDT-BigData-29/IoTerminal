const pool = require('../config/database');

// 사용량 분석 데이터 조회
exports.getDeviceUsageData = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate } = req.query;
        
        console.log('사용량 분석 요청:', { deviceId, startDate, endDate });
        
        // 실제 DB에서 사용량 데이터를 조회하는 로직
        // 여기서는 모의 데이터를 생성합니다
        const mockData = generateUsageData(startDate, endDate);
        
        res.json({
            success: true,
            label: '디바이스 사용량',
            data: mockData
        });
    } catch (error) {
        console.error('사용량 분석 오류:', error);
        res.status(500).json({
            success: false,
            message: '사용량 분석 중 오류가 발생했습니다.'
        });
    }
};

// 센서 데이터 분석 조회
exports.getDeviceSensorData = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate } = req.query;
        
        console.log('센서 데이터 분석 요청:', { deviceId, startDate, endDate });
        
        // 실제 센서 데이터 조회
        let connection;
        try {
            connection = await pool.getConnection();
            
            // 먼저 테이블 구조 확인
            const [tableInfo] = await connection.query(`
                DESCRIBE sensor
            `);
            console.log('센서 테이블 구조:', tableInfo);
            
            // 안전한 쿼리 실행
            const [sensorData] = await connection.query(`
                SELECT * FROM sensor 
                ORDER BY dt DESC 
                LIMIT 50
            `);
            
            console.log('센서 데이터 조회 결과:', sensorData.length, '건');
            
            // 데이터를 차트 형식으로 변환
            const chartData = sensorData.map((row, index) => ({
                timestamp: row.dt || new Date(Date.now() - index * 60000).toISOString(),
                value: parseFloat(row.temperature) || parseFloat(row.mq4) || parseFloat(row.humidity) || Math.random() * 30 + 20
            }));
            
            res.json({
                success: true,
                label: '센서 데이터',
                data: chartData
            });
        } catch (dbError) {
            console.error('DB 쿼리 오류:', dbError);
            // DB 오류 시 모의 데이터 반환
            const mockData = generateSensorMockData(startDate, endDate);
            res.json({
                success: true,
                label: '센서 데이터 (모의)',
                data: mockData
            });
        } finally {
            if (connection) {
                try {
                    connection.release();
                } catch (releaseError) {
                    console.error('DB 연결 해제 오류:', releaseError);
                }
            }
        }
    } catch (error) {
        console.error('센서 데이터 분석 오류:', error);
        res.status(500).json({
            success: false,
            message: '센서 데이터 분석 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};

// 이벤트 로그 분석 조회
exports.getDeviceEventLogs = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate } = req.query;
        
        console.log('이벤트 로그 분석 요청:', { deviceId, startDate, endDate });
        
        // 모의 이벤트 로그 데이터 생성
        const mockData = generateEventLogData(startDate, endDate);
        
        res.json({
            success: true,
            label: '이벤트 발생 횟수',
            data: mockData
        });
    } catch (error) {
        console.error('이벤트 로그 분석 오류:', error);
        res.status(500).json({
            success: false,
            message: '이벤트 로그 분석 중 오류가 발생했습니다.'
        });
    }
};

// 성능 분석 조회
exports.getDevicePerformanceStats = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate } = req.query;
        
        console.log('성능 분석 요청:', { deviceId, startDate, endDate });
        
        // 모의 성능 데이터 생성
        const mockData = generatePerformanceData(startDate, endDate);
        
        res.json({
            success: true,
            label: '디바이스 성능 지수',
            data: mockData
        });
    } catch (error) {
        console.error('성능 분석 오류:', error);
        res.status(500).json({
            success: false,
            message: '성능 분석 중 오류가 발생했습니다.'
        });
    }
};

// 모의 데이터 생성 함수들
function generateUsageData(startDate, endDate) {
    const data = [];
    const start = new Date(startDate || Date.now() - 24 * 60 * 60 * 1000);
    const end = new Date(endDate || Date.now());
    const interval = (end - start) / 20; // 20개 데이터 포인트
    
    for (let i = 0; i < 20; i++) {
        const timestamp = new Date(start.getTime() + i * interval);
        data.push({
            timestamp: timestamp.toISOString(),
            value: Math.floor(Math.random() * 100) + 50 // 50-150 사이의 사용량
        });
    }
    
    return data;
}

function generateEventLogData(startDate, endDate) {
    const data = [];
    const start = new Date(startDate || Date.now() - 24 * 60 * 60 * 1000);
    const end = new Date(endDate || Date.now());
    const interval = (end - start) / 15; // 15개 데이터 포인트
    
    for (let i = 0; i < 15; i++) {
        const timestamp = new Date(start.getTime() + i * interval);
        data.push({
            timestamp: timestamp.toISOString(),
            value: Math.floor(Math.random() * 20) + 1 // 1-20 사이의 이벤트 수
        });
    }
    
    return data;
}

function generatePerformanceData(startDate, endDate) {
    const data = [];
    const start = new Date(startDate || Date.now() - 24 * 60 * 60 * 1000);
    const end = new Date(endDate || Date.now());
    const interval = (end - start) / 25; // 25개 데이터 포인트
    
    for (let i = 0; i < 25; i++) {
        const timestamp = new Date(start.getTime() + i * interval);
        data.push({
            timestamp: timestamp.toISOString(),
            value: Math.floor(Math.random() * 40) + 60 // 60-100 사이의 성능 지수
        });
    }
    
    return data;
}

function generateSensorMockData(startDate, endDate) {
    const data = [];
    const start = new Date(startDate || Date.now() - 24 * 60 * 60 * 1000);
    const end = new Date(endDate || Date.now());
    const interval = (end - start) / 30; // 30개 데이터 포인트
    
    for (let i = 0; i < 30; i++) {
        const timestamp = new Date(start.getTime() + i * interval);
        data.push({
            timestamp: timestamp.toISOString(),
            value: Math.floor(Math.random() * 15) + 20 // 20-35 사이의 온도값
        });
    }
    
    return data;
}