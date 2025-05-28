const express = require('express');
const router = express.Router();

// 임시 데이터 저장소 (실제로는 데이터베이스를 사용해야 함)
let sensorAlerts = [];
let sensorSettings = {
    email_enabled: true,
    browser_enabled: true,
    sound_enabled: true,
    critical_only: false,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
};

let sensorThresholds = [
    {
        sensor_type: 'mq4',
        sensor_name: '메탄 가스 센서',
        unit: 'ppm',
        sensor_location: '서울시 강남구 테헤란로 123',
        normal_min: 0,
        normal_max: 25,
        warning_min: 25,
        warning_max: 50,
        critical_min: 50,
        critical_max: 100,
        spike_threshold: 20,
        enabled: true
    },
    {
        sensor_type: 'mq136',
        sensor_name: '황화수소 가스 센서',
        unit: 'ppm',
        sensor_location: '서울시 강남구 테헤란로 125',
        normal_min: 0,
        normal_max: 10,
        warning_min: 10,
        warning_max: 20,
        critical_min: 20,
        critical_max: 50,
        spike_threshold: 15,
        enabled: true
    }
];

// 센서 알림 목록 조회
router.get('/alerts', (req, res) => {
    try {
        const { limit = 50, offset = 0, severity, sensor_type, resolved } = req.query;
        
        let filteredAlerts = [...sensorAlerts];
        
        if (severity) {
            filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
        }
        
        if (sensor_type) {
            filteredAlerts = filteredAlerts.filter(alert => alert.sensor_type === sensor_type);
        }
        
        if (resolved !== undefined) {
            const isResolved = resolved === 'true';
            filteredAlerts = filteredAlerts.filter(alert => alert.is_resolved === isResolved);
        }
        
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            data: {
                alerts: paginatedAlerts,
                total: filteredAlerts.length,
                hasMore: endIndex < filteredAlerts.length
            }
        });
    } catch (error) {
        console.error('센서 알림 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '센서 알림 목록을 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 센서 알림 해결 처리
router.put('/alerts/:id/resolve', (req, res) => {
    try {
        const { id } = req.params;
        const alert = sensorAlerts.find(a => a.id === parseInt(id));
        
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: '센서 알림을 찾을 수 없습니다.'
            });
        }
        
        alert.is_resolved = true;
        alert.resolved_at = new Date().toISOString();
        
        res.json({
            success: true,
            data: alert,
            message: '센서 알림이 해결 처리되었습니다.'
        });
    } catch (error) {
        console.error('센서 알림 해결 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '센서 알림 해결 처리 중 오류가 발생했습니다.'
        });
    }
});

// 센서 임계값 조회
router.get('/thresholds', (req, res) => {
    try {
        res.json({
            success: true,
            data: sensorThresholds
        });
    } catch (error) {
        console.error('센서 임계값 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '센서 임계값을 조회하는 중 오류가 발생했습니다.'
        });
    }
});

// 센서 임계값 생성
router.post('/thresholds', (req, res) => {
    try {
        const thresholdData = req.body;
        
        // 이미 존재하는 센서 타입인지 확인
        const existingThreshold = sensorThresholds.find(t => t.sensor_type === thresholdData.sensor_type);
        if (existingThreshold) {
            return res.status(400).json({
                success: false,
                message: '이미 존재하는 센서 타입입니다.'
            });
        }
        
        const newThreshold = {
            ...thresholdData,
            enabled: true
        };
        
        sensorThresholds.push(newThreshold);
        
        res.json({
            success: true,
            data: newThreshold,
            message: '센서 임계값이 생성되었습니다.'
        });
    } catch (error) {
        console.error('센서 임계값 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '센서 임계값 생성 중 오류가 발생했습니다.'
        });
    }
});

// 센서 임계값 업데이트
router.put('/thresholds/:sensorType', (req, res) => {
    try {
        const { sensorType } = req.params;
        const updateData = req.body;
        
        const thresholdIndex = sensorThresholds.findIndex(t => t.sensor_type === sensorType);
        if (thresholdIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '센서 임계값을 찾을 수 없습니다.'
            });
        }
        
        sensorThresholds[thresholdIndex] = {
            ...sensorThresholds[thresholdIndex],
            ...updateData
        };
        
        res.json({
            success: true,
            data: sensorThresholds[thresholdIndex],
            message: '센서 임계값이 업데이트되었습니다.'
        });
    } catch (error) {
        console.error('센서 임계값 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '센서 임계값 업데이트 중 오류가 발생했습니다.'
        });
    }
});

// 센서 임계값 삭제
router.delete('/thresholds/:sensorType', (req, res) => {
    try {
        const { sensorType } = req.params;
        
        const thresholdIndex = sensorThresholds.findIndex(t => t.sensor_type === sensorType);
        if (thresholdIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '센서 임계값을 찾을 수 없습니다.'
            });
        }
        
        sensorThresholds.splice(thresholdIndex, 1);
        
        res.json({
            success: true,
            message: '센서 임계값이 삭제되었습니다.'
        });
    } catch (error) {
        console.error('센서 임계값 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '센서 임계값 삭제 중 오류가 발생했습니다.'
        });
    }
});

// 센서 알림 설정 조회
router.get('/settings', (req, res) => {
    try {
        res.json({
            success: true,
            data: sensorSettings
        });
    } catch (error) {
        console.error('센서 알림 설정 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '센서 알림 설정을 조회하는 중 오류가 발생했습니다.'
        });
    }
});

// 센서 알림 설정 업데이트
router.put('/settings', (req, res) => {
    try {
        const updatedSettings = req.body;
        sensorSettings = { ...sensorSettings, ...updatedSettings };
        
        res.json({
            success: true,
            data: sensorSettings,
            message: '센서 알림 설정이 업데이트되었습니다.'
        });
    } catch (error) {
        console.error('센서 알림 설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '센서 알림 설정 업데이트 중 오류가 발생했습니다.'
        });
    }
});

// 테스트 센서 알림 생성
router.post('/test-alert', (req, res) => {
    try {
        const { sensor_type = 'mq4', value = 55.0 } = req.body;
        
        const threshold = sensorThresholds.find(t => t.sensor_type === sensor_type);
        if (!threshold) {
            return res.status(404).json({
                success: false,
                message: '해당 센서 타입의 임계값을 찾을 수 없습니다.'
            });
        }
        
        let severity = 'normal';
        let message = `${threshold.sensor_name} 정상 범위 (${value}${threshold.unit})`;
        
        if (value > threshold.critical_max || value < threshold.critical_min) {
            severity = 'critical';
            message = `${threshold.sensor_name} 위험 수준 감지! (${value}${threshold.unit})`;
        } else if (value > threshold.warning_max || value < threshold.warning_min) {
            severity = 'warning';
            message = `${threshold.sensor_name} 경고 수준 감지 (${value}${threshold.unit})`;
        }
        
        const testAlert = {
            id: Date.now(),
            sensor_type: sensor_type,
            sensor_name: threshold.sensor_name,
            sensor_location: threshold.sensor_location,
            value: value,
            unit: threshold.unit,
            severity: severity,
            message: message,
            alert_type: 'threshold_violation',
            is_resolved: false,
            created_at: new Date().toISOString(),
            metadata: { isTest: true }
        };
        
        sensorAlerts.unshift(testAlert);
        
        res.json({
            success: true,
            data: testAlert,
            message: '테스트 센서 알림이 생성되었습니다.'
        });
    } catch (error) {
        console.error('테스트 센서 알림 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '테스트 센서 알림 생성 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router; 