const express = require('express');
const router = express.Router();
const sensorAnomalyService = require('../services/sensorAnomalyService');

// 인증 미들웨어 (임시로 사용자 ID를 1로 고정)
const authenticateUser = (req, res, next) => {
    req.userId = 1; // 임시로 사용자 ID 1로 고정
    next();
};

// 센서 이상치 알림 목록 조회
router.get('/alerts', authenticateUser, async (req, res) => {
    try {
        const {
            limit = 50,
            offset = 0,
            severity,
            sensor_type,
            resolved,
            farmno = '1',
            zone = 'A'
        } = req.query;

        const options = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            severity,
            sensor_type,
            resolved: resolved !== undefined ? resolved === 'true' : null,
            farmno,
            zone
        };

        const result = await sensorAnomalyService.getAlerts(options);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('센서 알림 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '센서 알림 목록을 조회하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 미해결 알림 수 조회
router.get('/alerts/unresolved-count', authenticateUser, async (req, res) => {
    try {
        const { farmno = '1', zone = 'A' } = req.query;
        
        const result = await sensorAnomalyService.getAlerts({
            limit: 1,
            resolved: false,
            farmno,
            zone
        });
        
        res.json({
            success: true,
            data: {
                unresolved_count: result.unresolved_count
            }
        });
    } catch (error) {
        console.error('미해결 알림 수 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '미해결 알림 수를 조회하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 해결 처리
router.put('/alerts/:id/resolve', authenticateUser, async (req, res) => {
    try {
        const alertId = parseInt(req.params.id);
        const success = await sensorAnomalyService.resolveAlert(alertId);
        
        if (success) {
            res.json({
                success: true,
                message: '알림이 해결 처리되었습니다.'
            });
        } else {
            res.status(404).json({
                success: false,
                message: '해당 알림을 찾을 수 없습니다.'
            });
        }
    } catch (error) {
        console.error('알림 해결 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림을 해결 처리하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 센서 임계값 설정 조회
router.get('/thresholds', authenticateUser, async (req, res) => {
    try {
        const thresholds = await sensorAnomalyService.getThresholds();
        
        res.json({
            success: true,
            data: thresholds
        });
    } catch (error) {
        console.error('센서 임계값 설정 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '센서 임계값 설정을 조회하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 센서 임계값 설정 업데이트
router.put('/thresholds/:sensorType', authenticateUser, async (req, res) => {
    try {
        const { sensorType } = req.params;
        const success = await sensorAnomalyService.updateThreshold(sensorType, req.body);
        
        if (success) {
            res.json({
                success: true,
                message: '센서 임계값 설정이 업데이트되었습니다.'
            });
        } else {
            res.status(400).json({
                success: false,
                message: '센서 임계값 설정 업데이트에 실패했습니다.'
            });
        }
    } catch (error) {
        console.error('센서 임계값 설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '센서 임계값 설정을 업데이트하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 설정 조회
router.get('/settings', authenticateUser, async (req, res) => {
    try {
        const settings = await sensorAnomalyService.getAlertSettings(req.userId);
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('알림 설정 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 설정을 조회하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 설정 업데이트
router.put('/settings', authenticateUser, async (req, res) => {
    try {
        const success = await sensorAnomalyService.updateAlertSettings(req.userId, req.body);
        
        if (success) {
            res.json({
                success: true,
                message: '알림 설정이 업데이트되었습니다.'
            });
        } else {
            res.status(400).json({
                success: false,
                message: '알림 설정 업데이트에 실패했습니다.'
            });
        }
    } catch (error) {
        console.error('알림 설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 설정을 업데이트하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 테스트용 이상치 알림 생성
router.post('/test-alert', authenticateUser, async (req, res) => {
    try {
        const { sensor_type = 'mq4', value = 55.0 } = req.body;
        
        // 테스트 센서 데이터 생성
        const testSensorData = {
            mq4: sensor_type === 'mq4' ? value : 20,
            mq136: sensor_type === 'mq136' ? value : 25,
            mq137: sensor_type === 'mq137' ? value : 15,
            farmno: '1',
            zone: 'A'
        };
        
        const alerts = await sensorAnomalyService.checkSensorAnomalies(testSensorData);
        
        res.json({
            success: true,
            message: `테스트 알림이 생성되었습니다. (생성된 알림 수: ${alerts.length})`,
            data: alerts
        });
    } catch (error) {
        console.error('테스트 알림 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '테스트 알림을 생성하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 센서별 최근 알림 통계
router.get('/stats', authenticateUser, async (req, res) => {
    try {
        const { farmno = '1', zone = 'A', days = 7 } = req.query;
        
        // 최근 N일간의 센서별 알림 통계 조회
        const db = require('../config/database');
        const [stats] = await db.query(`
            SELECT 
                sensor_type,
                sensor_name,
                severity,
                COUNT(*) as alert_count,
                MAX(created_at) as last_alert_time
            FROM sensor_anomaly_alerts 
            WHERE farmno = ? AND zone = ? 
            AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY sensor_type, sensor_name, severity
            ORDER BY sensor_type, severity
        `, [farmno, zone, parseInt(days)]);
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('센서 알림 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '센서 알림 통계를 조회하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router; 