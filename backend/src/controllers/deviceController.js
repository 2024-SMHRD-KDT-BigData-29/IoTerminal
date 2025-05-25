const pool = require('../config/database');

// 사용자의 디바이스 목록 조회
exports.getUserDevices = async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'user_id가 필요합니다.'
            });
        }

        const [devices] = await pool.execute(
            'SELECT * FROM devices WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        // 디바이스 설정 정보를 파싱
        const parsedDevices = devices.map(device => ({
            ...device,
            config: device.config ? (typeof device.config === 'string' ? JSON.parse(device.config) : device.config) : {},
            status: device.status ? (typeof device.status === 'string' ? JSON.parse(device.status) : device.status) : {}
        }));

        res.json({
            success: true,
            devices: parsedDevices
        });
    } catch (error) {
        console.error('디바이스 목록 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '디바이스 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};

// 디바이스 상태 조회
exports.getDeviceStatus = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const userId = req.user.user_id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'user_id가 필요합니다.'
            });
        }

        const [devices] = await pool.execute(
            'SELECT * FROM devices WHERE device_id = ? AND user_id = ?',
            [deviceId, userId]
        );

        if (devices.length === 0) {
            return res.status(404).json({
                success: false,
                message: '디바이스를 찾을 수 없거나 접근 권한이 없습니다.'
            });
        }

        const device = devices[0];
        const status = {
            ...device,
            config: device.config ? JSON.parse(device.config) : {},
            status: device.status ? JSON.parse(device.status) : {}
        };

        res.json({
            success: true,
            status
        });
    } catch (error) {
        console.error('디바이스 상태 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '디바이스 상태 조회 중 오류가 발생했습니다.'
        });
    }
};

// 디바이스 생성
exports.createDevice = async (req, res) => {
    try {
        const { name, type, description, config } = req.body;
        const userId = req.user.user_id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'user_id가 필요합니다.'
            });
        }

        if (!name || !type) {
            return res.status(400).json({
                success: false,
                message: '디바이스 이름과 타입은 필수입니다.'
            });
        }

        const [result] = await pool.execute(
            'INSERT INTO devices (name, type, description, config, user_id) VALUES (?, ?, ?, ?, ?)',
            [name, type, description || '', JSON.stringify(config || {}), userId]
        );

        res.status(201).json({
            success: true,
            message: '디바이스가 성공적으로 생성되었습니다.',
            device: {
                device_id: result.insertId,
                name,
                type,
                description,
                config,
                user_id: userId
            }
        });
    } catch (error) {
        console.error('디바이스 생성 실패:', error);
        res.status(500).json({
            success: false,
            message: '디바이스 생성 중 오류가 발생했습니다.'
        });
    }
};

// 디바이스 수정
exports.updateDevice = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { name, type, description, config } = req.body;
        const userId = req.user.user_id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'user_id가 필요합니다.'
            });
        }

        const [result] = await pool.execute(
            'UPDATE devices SET name = ?, type = ?, description = ?, config = ? WHERE device_id = ? AND user_id = ?',
            [name, type, description || '', JSON.stringify(config || {}), deviceId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '디바이스를 찾을 수 없거나 수정 권한이 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '디바이스가 성공적으로 수정되었습니다.',
            device: {
                device_id: deviceId,
                name,
                type,
                description,
                config,
                user_id: userId
            }
        });
    } catch (error) {
        console.error('디바이스 수정 실패:', error);
        res.status(500).json({
            success: false,
            message: '디바이스 수정 중 오류가 발생했습니다.'
        });
    }
};

// 디바이스 삭제
exports.deleteDevice = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const userId = req.user.user_id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'user_id가 필요합니다.'
            });
        }

        const [result] = await pool.execute(
            'DELETE FROM devices WHERE device_id = ? AND user_id = ?',
            [deviceId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '디바이스를 찾을 수 없거나 삭제 권한이 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '디바이스가 성공적으로 삭제되었습니다.'
        });
    } catch (error) {
        console.error('디바이스 삭제 실패:', error);
        res.status(500).json({
            success: false,
            message: '디바이스 삭제 중 오류가 발생했습니다.'
        });
    }
};

// 사용자 지정 기간 디바이스 데이터 분석
exports.getDeviceDataByDateRange = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate } = req.query;
        const userId = req.user.user_id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'user_id가 필요합니다.'
            });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: '시작 날짜와 종료 날짜가 필요합니다.'
            });
        }

        // 디바이스 소유권 확인
        const [deviceCheck] = await pool.execute(
            'SELECT * FROM devices WHERE device_id = ? AND user_id = ?',
            [deviceId, userId]
        );

        if (deviceCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: '디바이스를 찾을 수 없거나 접근 권한이 없습니다.'
            });
        }

        // 지정된 기간의 데이터 조회
        const [data] = await pool.execute(
            `SELECT 
                created_at,
                status,
                HOUR(created_at) as hour,
                DATE(created_at) as date
            FROM device_data 
            WHERE device_id = ? 
            AND created_at BETWEEN ? AND ?
            ORDER BY created_at ASC`,
            [deviceId, startDate, endDate]
        );

        // 데이터 파싱 및 분석
        const parsedData = data.map(record => ({
            ...record,
            status: typeof record.status === 'string' ? JSON.parse(record.status) : record.status,
            timestamp: record.created_at
        }));

        // 기본 통계 계산
        const statistics = {
            totalRecords: parsedData.length,
            averages: {},
            maxValues: {},
            minValues: {},
            timeDistribution: {}
        };

        if (parsedData.length > 0) {
            // 첫 번째 레코드의 status 키를 기준으로 통계 초기화
            const firstRecord = parsedData[0];
            const metrics = Object.keys(firstRecord.status || {});
            
            metrics.forEach(metric => {
                let values = parsedData
                    .map(record => record.status[metric])
                    .filter(value => typeof value === 'number');

                if (values.length > 0) {
                    statistics.averages[metric] = values.reduce((a, b) => a + b, 0) / values.length;
                    statistics.maxValues[metric] = Math.max(...values);
                    statistics.minValues[metric] = Math.min(...values);
                }
            });

            // 시간대별 분포
            parsedData.forEach(record => {
                const hour = record.hour;
                if (!statistics.timeDistribution[hour]) {
                    statistics.timeDistribution[hour] = 0;
                }
                statistics.timeDistribution[hour]++;
            });
        }

        // 일별 데이터 그룹화
        const dailyData = {};
        parsedData.forEach(record => {
            const date = record.date;
            if (!dailyData[date]) {
                dailyData[date] = [];
            }
            dailyData[date].push(record);
        });

        res.json({
            success: true,
            deviceId,
            period: {
                start: startDate,
                end: endDate
            },
            statistics,
            dailyData,
            rawData: parsedData
        });
    } catch (error) {
        console.error('디바이스 데이터 분석 실패:', error);
        res.status(500).json({
            success: false,
            message: '디바이스 데이터 분석 중 오류가 발생했습니다.',
            error: error.message
        });
    }
}; 