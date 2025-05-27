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

// 모의 데이터 생성 함수들
function generateUsageData(startDate, endDate) {
    const data = [];
    const start = new Date(startDate || Date.now() - 24 * 60 * 60 * 1000);
    const end = new Date(endDate || Date.now());
    const timeDiff = end - start;
    
    // 시간 범위에 따른 데이터 포인트 수와 간격 결정
    let dataPoints, intervalMs;
    
    if (timeDiff <= 24 * 60 * 60 * 1000) {
        // 24시간 이하: 1시간 간격으로 24개 포인트
        dataPoints = 24;
        intervalMs = (24 * 60 * 60 * 1000) / dataPoints; // 정확히 1시간 간격
    } else if (timeDiff <= 7 * 24 * 60 * 60 * 1000) {
        // 7일 이하: 4시간 간격으로 42개 포인트
        dataPoints = 42;
        intervalMs = (7 * 24 * 60 * 60 * 1000) / dataPoints; // 정확히 4시간 간격
    } else if (timeDiff <= 30 * 24 * 60 * 60 * 1000) {
        // 30일 이하: 12시간 간격으로 60개 포인트
        dataPoints = 60;
        intervalMs = (30 * 24 * 60 * 60 * 1000) / dataPoints; // 정확히 12시간 간격
    } else {
        // 1년: 3일 간격으로 120개 포인트
        dataPoints = 120;
        intervalMs = (365 * 24 * 60 * 60 * 1000) / dataPoints; // 정확히 3일 간격
    }
    
    // 현재 시간에서 역순으로 데이터 생성 (최신 데이터가 마지막에 오도록)
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC + 9시간
    
    for (let i = 0; i < dataPoints; i++) {
        // 현재 시간에서 역순으로 계산
        const timestamp = new Date(koreaTime.getTime() - ((dataPoints - 1 - i) * intervalMs));
        
        // 시간대별 변화 패턴 적용 (낮에 사용량이 높고 밤에 낮음)
        const hour = timestamp.getHours();
        const timeOfDayFactor = 0.6 + 0.8 * Math.sin((hour - 6) * Math.PI / 12);
        
        // 요일별 변화 (주말에는 사용량이 적음)
        const dayOfWeek = timestamp.getDay();
        const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.0;
        
        // 계절별 변화 (월별로 조정)
        const month = timestamp.getMonth();
        const seasonalFactor = 0.8 + 0.4 * Math.sin((month - 2) * Math.PI / 6);
        
        // 기간에 따른 기본 사용량 조정
        let baseUsage;
        if (timeDiff <= 24 * 60 * 60 * 1000) {
            // 24시간: 시간별 세밀한 변화
            baseUsage = 70 + Math.random() * 60; // 70-130 사이
        } else if (timeDiff <= 7 * 24 * 60 * 60 * 1000) {
            // 7일: 일별 변화
            baseUsage = 80 + Math.random() * 80; // 80-160 사이
        } else if (timeDiff <= 30 * 24 * 60 * 60 * 1000) {
            // 30일: 주별 변화
            baseUsage = 90 + Math.random() * 100; // 90-190 사이
        } else {
            // 1년: 월별 변화
            baseUsage = 100 + Math.random() * 120; // 100-220 사이
        }
        
        // 모든 팩터 적용
        const finalUsage = Math.floor(baseUsage * timeOfDayFactor * weekendFactor * seasonalFactor);
        
        data.push({
            timestamp: timestamp.toISOString(),
            value: Math.max(10, finalUsage) // 최소 10 이상
        });
    }
    
    return data;
}

function generateEventLogData(startDate, endDate) {
    const data = [];
    const start = new Date(startDate || Date.now() - 7 * 24 * 60 * 60 * 1000); // 기본 7일
    const end = new Date(endDate || Date.now());
    const timeDiff = end - start;
    
    // 기간에 따른 날짜 수 결정
    let dayCount;
    if (timeDiff <= 24 * 60 * 60 * 1000) {
        // 24시간 이하: 1일
        dayCount = 1;
    } else if (timeDiff <= 7 * 24 * 60 * 60 * 1000) {
        // 7일 이하: 7일
        dayCount = 7;
    } else if (timeDiff <= 30 * 24 * 60 * 60 * 1000) {
        // 30일 이하: 30일
        dayCount = 30;
    } else {
        // 1년: 365일
        dayCount = 365;
    }
    
    // 날짜별로 데이터 생성 (하루 단위)
    const currentDate = new Date(end);
    const eventTypes = [
        { name: '센서 알림', weight: 0.4, color: 'rgba(255, 99, 132, 0.8)' },
        { name: '시스템 경고', weight: 0.3, color: 'rgba(54, 162, 235, 0.8)' },
        { name: '연결 오류', weight: 0.2, color: 'rgba(255, 206, 86, 0.8)' },
        { name: '데이터 이상', weight: 0.1, color: 'rgba(75, 192, 192, 0.8)' }
    ];
    
    for (let i = 0; i < dayCount; i++) {
        const targetDate = new Date(currentDate.getTime() - (i * 24 * 60 * 60 * 1000));
        const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
        
        // 각 이벤트 타입별로 발생 횟수 생성
        eventTypes.forEach(eventType => {
            // 요일에 따른 가중치 (주말에는 이벤트가 적음)
            const dayOfWeek = targetDate.getDay();
            const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.5 : 1.0;
            
            // 기간에 따른 기본 이벤트 수 조정
            let baseEventCount;
            if (dayCount === 1) {
                // 24시간: 시간당 이벤트로 계산 (24개 데이터 포인트)
                baseEventCount = Math.floor(Math.random() * 3) + 1; // 1-3개
            } else if (dayCount <= 7) {
                // 7일: 일당 적당한 이벤트 수
                baseEventCount = Math.floor(Math.random() * 15) + 5; // 5-19개
            } else if (dayCount <= 30) {
                // 30일: 일당 더 많은 이벤트
                baseEventCount = Math.floor(Math.random() * 25) + 10; // 10-34개
            } else {
                // 1년: 일당 많은 이벤트
                baseEventCount = Math.floor(Math.random() * 40) + 15; // 15-54개
            }
            
            // 이벤트 타입 가중치와 주말 팩터 적용
            const adjustedCount = Math.floor(baseEventCount * eventType.weight * weekendFactor);
            
            if (adjustedCount > 0) {
                data.push({
                    timestamp: targetDate.toISOString(),
                    date: dateStr,
                    eventType: eventType.name,
                    value: adjustedCount,
                    color: eventType.color
                });
            }
        });
    }
    
    return data;
}

function generateSensorMockData(startDate, endDate) {
    const data = [];
    const start = new Date(startDate || Date.now() - 24 * 60 * 60 * 1000);
    const end = new Date(endDate || Date.now());
    const timeDiff = end - start;
    
    // 시간 범위에 따른 데이터 포인트 수와 간격 결정
    let dataPoints, intervalMs, label;
    
    if (timeDiff <= 24 * 60 * 60 * 1000) {
        // 24시간 이하: 30분 간격으로 48개 포인트
        dataPoints = 48;
        intervalMs = (24 * 60 * 60 * 1000) / dataPoints; // 정확히 30분 간격
        label = '시간별 센서 데이터';
    } else if (timeDiff <= 7 * 24 * 60 * 60 * 1000) {
        // 7일 이하: 2시간 간격으로 84개 포인트
        dataPoints = 84;
        intervalMs = (7 * 24 * 60 * 60 * 1000) / dataPoints; // 정확히 2시간 간격
        label = '시간별 센서 데이터 (7일)';
    } else if (timeDiff <= 30 * 24 * 60 * 60 * 1000) {
        // 30일 이하: 6시간 간격으로 120개 포인트
        dataPoints = 120;
        intervalMs = (30 * 24 * 60 * 60 * 1000) / dataPoints; // 정확히 6시간 간격
        label = '일별 센서 데이터 (30일)';
    } else {
        // 1년: 1일 간격으로 365개 포인트
        dataPoints = 365;
        intervalMs = (365 * 24 * 60 * 60 * 1000) / dataPoints; // 정확히 1일 간격
        label = '일별 센서 데이터 (1년)';
    }
    
    // 센서 타입별 기본값 설정
    const sensorTypes = [
        { name: 'gas_methane', min: 15, max: 35, unit: 'ppm' },
        { name: 'gas_h2s', min: 20, max: 45, unit: 'ppm' },
        { name: 'gas_nh3', min: 10, max: 25, unit: 'ppm' }
    ];
    
    // 현재 시간에서 역순으로 데이터 생성 (최신 데이터가 마지막에 오도록)
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC + 9시간
    
    for (let i = 0; i < dataPoints; i++) {
        // 현재 시간에서 역순으로 계산
        const timestamp = new Date(koreaTime.getTime() - ((dataPoints - 1 - i) * intervalMs));
        
        // 시간대별 변화 패턴 적용 (온도는 낮에 높고 밤에 낮음)
        const hour = timestamp.getHours();
        const timeOfDayFactor = 0.8 + 0.4 * Math.sin((hour - 6) * Math.PI / 12);
        
        // 요일별 변화 (주말에는 약간 다른 패턴)
        const dayOfWeek = timestamp.getDay();
        const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.9 : 1.0;
        
        // 계절별 변화 (월별로 조정)
        const month = timestamp.getMonth();
        const seasonalFactor = 0.7 + 0.6 * Math.sin((month - 2) * Math.PI / 6);
        
        sensorTypes.forEach(sensorType => {
            let baseValue = sensorType.min + (sensorType.max - sensorType.min) * 0.5;
            let variation = (sensorType.max - sensorType.min) * 0.3;
            
            // 센서별 특별한 패턴 적용
            if (sensorType.name.includes('gas')) {
                // 가스 센서는 더 불규칙한 패턴
                variation *= (1 + Math.random() * 0.5);
                baseValue *= timeOfDayFactor * weekendFactor;
            }
            
            const randomVariation = (Math.random() - 0.5) * variation;
            const value = Math.max(sensorType.min, 
                Math.min(sensorType.max, baseValue + randomVariation));
            
            data.push({
                timestamp: timestamp.toISOString(),
                sensorType: sensorType.name,
                value: parseFloat(value.toFixed(1)),
                unit: sensorType.unit
            });
        });
    }
    
    return data;
}