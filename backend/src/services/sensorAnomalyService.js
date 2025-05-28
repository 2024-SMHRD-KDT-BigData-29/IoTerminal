const db = require('../config/database');

class SensorAnomalyService {
    constructor() {
        this.previousValues = new Map(); // 이전 센서 값 저장
        this.alertCooldown = new Map(); // 알림 쿨다운 관리 (중복 알림 방지)
        this.COOLDOWN_MINUTES = 5; // 5분 쿨다운
    }

    // 센서 데이터 이상치 검사
    async checkSensorAnomalies(sensorData) {
        try {
            const { mq4, mq136, mq137, farmno = '1', zone = 'A' } = sensorData;
            
            // 가스 센서 3개만 이상치 검사
            const sensors = [
                { type: 'mq4', name: '메탄 가스 센서', value: mq4 },
                { type: 'mq136', name: '황화수소 가스 센서', value: mq136 },
                { type: 'mq137', name: '암모니아 가스 센서', value: mq137 }
            ];

            const alerts = [];

            for (const sensor of sensors) {
                if (sensor.value === null || sensor.value === undefined) continue;

                const sensorAlerts = await this.checkSingleSensorAnomaly(
                    sensor.type, 
                    sensor.name, 
                    sensor.value, 
                    farmno, 
                    zone
                );
                alerts.push(...sensorAlerts);
            }

            return alerts;
        } catch (error) {
            console.error('센서 이상치 검사 오류:', error);
            return [];
        }
    }

    // 개별 센서 이상치 검사
    async checkSingleSensorAnomaly(sensorType, sensorName, currentValue, farmno, zone) {
        try {
            // 센서 임계값 설정 조회
            const [thresholdRows] = await db.query(
                'SELECT * FROM sensor_thresholds WHERE sensor_type = ? AND enabled = TRUE',
                [sensorType]
            );

            if (thresholdRows.length === 0) {
                console.warn(`센서 임계값 설정이 없습니다: ${sensorType}`);
                return [];
            }

            const threshold = thresholdRows[0];
            const alerts = [];
            const previousValue = this.previousValues.get(sensorType);

            // 1. 임계값 초과/미달 검사
            const thresholdAlert = this.checkThresholdViolation(
                sensorType, sensorName, currentValue, threshold, farmno, zone
            );
            if (thresholdAlert) alerts.push(thresholdAlert);

            // 2. 급격한 변화 검사 (이전 값이 있는 경우)
            if (previousValue !== undefined) {
                const spikeAlert = this.checkSuddenChange(
                    sensorType, sensorName, currentValue, previousValue, threshold, farmno, zone
                );
                if (spikeAlert) alerts.push(spikeAlert);
            }

            // 3. 센서 오작동 검사 (값이 범위를 벗어나는 경우)
            const malfunctionAlert = this.checkSensorMalfunction(
                sensorType, sensorName, currentValue, threshold, farmno, zone
            );
            if (malfunctionAlert) alerts.push(malfunctionAlert);

            // 현재 값을 이전 값으로 저장
            this.previousValues.set(sensorType, currentValue);

            // 쿨다운 체크 후 알림 생성
            const validAlerts = [];
            for (const alert of alerts) {
                if (this.checkCooldown(alert)) {
                    await this.createAlert(alert);
                    validAlerts.push(alert);
                }
            }

            return validAlerts;
        } catch (error) {
            console.error(`센서 ${sensorType} 이상치 검사 오류:`, error);
            return [];
        }
    }

    // 임계값 위반 검사
    checkThresholdViolation(sensorType, sensorName, value, threshold, farmno, zone) {
        let alertType = null;
        let severity = 'low';
        let thresholdValue = null;

        // Critical 레벨 체크
        if (value > threshold.critical_max) {
            alertType = 'threshold_high';
            severity = 'critical';
            thresholdValue = threshold.critical_max;
        } else if (value < threshold.critical_min) {
            alertType = 'threshold_low';
            severity = 'critical';
            thresholdValue = threshold.critical_min;
        }
        // Warning 레벨 체크
        else if (value > threshold.warning_max) {
            alertType = 'threshold_high';
            severity = 'high';
            thresholdValue = threshold.warning_max;
        } else if (value < threshold.warning_min) {
            alertType = 'threshold_low';
            severity = 'high';
            thresholdValue = threshold.warning_min;
        }
        // Normal 범위 벗어남 체크
        else if (value > threshold.normal_max) {
            alertType = 'threshold_high';
            severity = 'medium';
            thresholdValue = threshold.normal_max;
        } else if (value < threshold.normal_min) {
            alertType = 'threshold_low';
            severity = 'medium';
            thresholdValue = threshold.normal_min;
        }

        if (alertType) {
            const message = this.generateThresholdMessage(sensorName, value, thresholdValue, alertType, severity);
            return {
                sensor_type: sensorType,
                sensor_name: sensorName,
                alert_type: alertType,
                current_value: value,
                threshold_value: thresholdValue,
                severity,
                message,
                farmno,
                zone
            };
        }

        return null;
    }

    // 급격한 변화 검사
    checkSuddenChange(sensorType, sensorName, currentValue, previousValue, threshold, farmno, zone) {
        const change = Math.abs(currentValue - previousValue);
        
        if (change > threshold.spike_threshold) {
            const alertType = currentValue > previousValue ? 'sudden_spike' : 'sudden_drop';
            const severity = change > (threshold.spike_threshold * 2) ? 'critical' : 'high';
            
            const message = this.generateSpikeMessage(sensorName, currentValue, previousValue, alertType, severity);
            
            return {
                sensor_type: sensorType,
                sensor_name: sensorName,
                alert_type: alertType,
                current_value: currentValue,
                previous_value: previousValue,
                threshold_value: threshold.spike_threshold,
                severity,
                message,
                farmno,
                zone
            };
        }

        return null;
    }

    // 센서 오작동 검사
    checkSensorMalfunction(sensorType, sensorName, value, threshold, farmno, zone) {
        // 물리적으로 불가능한 값 체크
        const absoluteMin = threshold.critical_min - (threshold.critical_min * 0.5);
        const absoluteMax = threshold.critical_max + (threshold.critical_max * 0.5);

        if (value < absoluteMin || value > absoluteMax) {
            const message = `${sensorName}에서 비정상적인 값이 감지되었습니다. 센서 점검이 필요합니다. (측정값: ${value}${threshold.unit})`;
            
            return {
                sensor_type: sensorType,
                sensor_name: sensorName,
                alert_type: 'sensor_malfunction',
                current_value: value,
                severity: 'critical',
                message,
                farmno,
                zone
            };
        }

        return null;
    }

    // 임계값 위반 메시지 생성
    generateThresholdMessage(sensorName, value, threshold, alertType, severity) {
        const direction = alertType === 'threshold_high' ? '초과' : '미달';
        const severityText = {
            'low': '주의',
            'medium': '경고',
            'high': '위험',
            'critical': '심각'
        };

        return `🚨 ${sensorName} ${severityText[severity]} 알림: 측정값 ${value}이(가) 임계값 ${threshold}을(를) ${direction}했습니다.`;
    }

    // 급격한 변화 메시지 생성
    generateSpikeMessage(sensorName, currentValue, previousValue, alertType, severity) {
        const direction = alertType === 'sudden_spike' ? '급상승' : '급하락';
        const change = Math.abs(currentValue - previousValue);
        const severityText = {
            'high': '위험',
            'critical': '심각'
        };

        return `⚡ ${sensorName} ${severityText[severity]} 알림: 측정값이 ${previousValue}에서 ${currentValue}로 ${direction}했습니다. (변화량: ${change.toFixed(1)})`;
    }

    // 쿨다운 체크 (중복 알림 방지)
    checkCooldown(alert) {
        const key = `${alert.sensor_type}_${alert.alert_type}`;
        const now = Date.now();
        const lastAlert = this.alertCooldown.get(key);

        if (lastAlert && (now - lastAlert) < (this.COOLDOWN_MINUTES * 60 * 1000)) {
            return false; // 쿨다운 중
        }

        this.alertCooldown.set(key, now);
        return true;
    }

    // 알림 데이터베이스에 저장
    async createAlert(alertData) {
        try {
            const [result] = await db.query(
                `INSERT INTO sensor_anomaly_alerts 
                (sensor_type, sensor_name, alert_type, current_value, threshold_value, previous_value, severity, message, farmno, zone) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    alertData.sensor_type,
                    alertData.sensor_name,
                    alertData.alert_type,
                    alertData.current_value,
                    alertData.threshold_value || null,
                    alertData.previous_value || null,
                    alertData.severity,
                    alertData.message,
                    alertData.farmno,
                    alertData.zone
                ]
            );

            const alert = {
                id: result.insertId,
                ...alertData,
                created_at: new Date()
            };

            console.log(`🚨 센서 이상치 알림 생성: ${alertData.sensor_name} - ${alertData.alert_type}`);
            return alert;
        } catch (error) {
            console.error('알림 저장 오류:', error);
            throw error;
        }
    }

    // 알림 목록 조회
    async getAlerts(options = {}) {
        try {
            const {
                limit = 50,
                offset = 0,
                severity = null,
                sensor_type = null,
                resolved = null,
                farmno = '1',
                zone = 'A'
            } = options;

            let whereClause = 'WHERE farmno = ? AND zone = ?';
            const params = [farmno, zone];

            if (severity) {
                whereClause += ' AND severity = ?';
                params.push(severity);
            }

            if (sensor_type) {
                whereClause += ' AND sensor_type = ?';
                params.push(sensor_type);
            }

            if (resolved !== null) {
                whereClause += ' AND is_resolved = ?';
                params.push(resolved);
            }

            const [alerts] = await db.query(
                `SELECT * FROM sensor_anomaly_alerts 
                ${whereClause} 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?`,
                [...params, limit, offset]
            );

            // 미해결 알림 수 조회
            const [countResult] = await db.query(
                'SELECT COUNT(*) as unresolved_count FROM sensor_anomaly_alerts WHERE farmno = ? AND zone = ? AND is_resolved = FALSE',
                [farmno, zone]
            );

            return {
                alerts,
                unresolved_count: countResult[0].unresolved_count
            };
        } catch (error) {
            console.error('알림 조회 오류:', error);
            throw error;
        }
    }

    // 알림 해결 처리
    async resolveAlert(alertId) {
        try {
            const [result] = await db.query(
                'UPDATE sensor_anomaly_alerts SET is_resolved = TRUE, resolved_at = NOW() WHERE id = ?',
                [alertId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('알림 해결 처리 오류:', error);
            throw error;
        }
    }

    // 모든 미해결 알림 해결 처리
    async resolveAllAlerts(farmno = '1', zone = 'A') {
        try {
            const [result] = await db.query(
                'UPDATE sensor_anomaly_alerts SET is_resolved = TRUE, resolved_at = NOW() WHERE is_resolved = FALSE AND farmno = ? AND zone = ?',
                [farmno, zone]
            );

            console.log(`✅ ${result.affectedRows}개의 알림이 해결 처리되었습니다. (농장: ${farmno}, 구역: ${zone})`);
            return result.affectedRows;
        } catch (error) {
            console.error('모든 알림 해결 처리 오류:', error);
            throw error;
        }
    }

    // 센서 임계값 설정 조회
    async getThresholds() {
        try {
            const [thresholds] = await db.query('SELECT * FROM sensor_thresholds ORDER BY sensor_type');
            
            // 임계값이 없으면 기본 임계값 생성
            if (thresholds.length === 0) {
                console.log('임계값 설정이 없습니다. 기본 임계값을 생성합니다...');
                await this.createDefaultThresholds();
                const [newThresholds] = await db.query('SELECT * FROM sensor_thresholds ORDER BY sensor_type');
                return newThresholds;
            }
            
            return thresholds;
        } catch (error) {
            console.error('임계값 설정 조회 오류:', error);
            throw error;
        }
    }

    // 기본 임계값 생성
    async createDefaultThresholds() {
        try {
            const defaultThresholds = [
                {
                    sensor_type: 'mq4',
                    sensor_name: '메탄 가스 센서',
                    unit: 'ppm',
                    normal_min: 5.0,
                    normal_max: 35.0,
                    warning_min: 3.0,
                    warning_max: 45.0,
                    critical_min: 1.0,
                    critical_max: 60.0,
                    spike_threshold: 15.0
                },
                {
                    sensor_type: 'mq136',
                    sensor_name: '황화수소 가스 센서',
                    unit: 'ppm',
                    normal_min: 8.0,
                    normal_max: 45.0,
                    warning_min: 5.0,
                    warning_max: 55.0,
                    critical_min: 2.0,
                    critical_max: 70.0,
                    spike_threshold: 20.0
                },
                {
                    sensor_type: 'mq137',
                    sensor_name: '암모니아 가스 센서',
                    unit: 'ppm',
                    normal_min: 2.0,
                    normal_max: 25.0,
                    warning_min: 1.0,
                    warning_max: 35.0,
                    critical_min: 0.5,
                    critical_max: 45.0,
                    spike_threshold: 12.0
                }
            ];

            for (const threshold of defaultThresholds) {
                await db.query(
                    `INSERT INTO sensor_thresholds 
                    (sensor_type, sensor_name, unit, normal_min, normal_max, warning_min, warning_max, critical_min, critical_max, spike_threshold) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        threshold.sensor_type,
                        threshold.sensor_name,
                        threshold.unit,
                        threshold.normal_min,
                        threshold.normal_max,
                        threshold.warning_min,
                        threshold.warning_max,
                        threshold.critical_min,
                        threshold.critical_max,
                        threshold.spike_threshold
                    ]
                );
            }

            console.log('✅ 기본 임계값 설정이 생성되었습니다.');
        } catch (error) {
            console.error('기본 임계값 생성 오류:', error);
            throw error;
        }
    }

    // 새로운 센서 임계값 생성
    async createThreshold(thresholdData) {
        try {
            const {
                sensor_type,
                sensor_name,
                unit,
                normal_min,
                normal_max,
                warning_min,
                warning_max,
                critical_min,
                critical_max,
                spike_threshold
            } = thresholdData;

            // 센서 타입 중복 체크
            const [existingThreshold] = await db.query(
                'SELECT id FROM sensor_thresholds WHERE sensor_type = ?',
                [sensor_type]
            );

            if (existingThreshold.length > 0) {
                throw new Error(`센서 타입 '${sensor_type}'이 이미 존재합니다.`);
            }

            const [result] = await db.query(
                `INSERT INTO sensor_thresholds 
                (sensor_type, sensor_name, unit, normal_min, normal_max, warning_min, warning_max, critical_min, critical_max, spike_threshold) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    sensor_type,
                    sensor_name,
                    unit,
                    normal_min,
                    normal_max,
                    warning_min,
                    warning_max,
                    critical_min,
                    critical_max,
                    spike_threshold
                ]
            );

            console.log(`✅ 새로운 센서 임계값 생성: ${sensor_name} (${sensor_type})`);
            return result.insertId;
        } catch (error) {
            console.error('임계값 생성 오류:', error);
            throw error;
        }
    }

    // 센서 임계값 설정 업데이트
    async updateThreshold(sensorType, thresholdData) {
        try {
            const allowedFields = [
                'normal_min', 'normal_max', 'warning_min', 'warning_max',
                'critical_min', 'critical_max', 'spike_threshold', 'enabled'
            ];

            const updateFields = [];
            const params = [];

            for (const [key, value] of Object.entries(thresholdData)) {
                if (allowedFields.includes(key)) {
                    updateFields.push(`${key} = ?`);
                    params.push(value);
                }
            }

            if (updateFields.length === 0) {
                throw new Error('업데이트할 유효한 필드가 없습니다.');
            }

            params.push(sensorType);

            const [result] = await db.query(
                `UPDATE sensor_thresholds SET ${updateFields.join(', ')} WHERE sensor_type = ?`,
                params
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('임계값 설정 업데이트 오류:', error);
            throw error;
        }
    }

    // 알림 설정 조회
    async getAlertSettings(userId = 1) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM alert_settings WHERE user_id = ?',
                [userId]
            );

            if (rows.length === 0) {
                // 기본 설정 생성
                await db.query(
                    'INSERT INTO alert_settings (user_id) VALUES (?)',
                    [userId]
                );
                return await this.getAlertSettings(userId);
            }

            return rows[0];
        } catch (error) {
            console.error('알림 설정 조회 오류:', error);
            throw error;
        }
    }

    // 알림 설정 업데이트
    async updateAlertSettings(userId = 1, settings) {
        try {
            const allowedFields = [
                'email_enabled', 'browser_enabled', 'sound_enabled', 'critical_only',
                'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end'
            ];

            const updateFields = [];
            const params = [];

            for (const [key, value] of Object.entries(settings)) {
                if (allowedFields.includes(key)) {
                    updateFields.push(`${key} = ?`);
                    params.push(value);
                }
            }

            if (updateFields.length === 0) {
                throw new Error('업데이트할 유효한 필드가 없습니다.');
            }

            params.push(userId);

            const [result] = await db.query(
                `UPDATE alert_settings SET ${updateFields.join(', ')} WHERE user_id = ?`,
                params
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('알림 설정 업데이트 오류:', error);
            throw error;
        }
    }

    // 조용한 시간 확인
    isQuietHours(settings) {
        if (!settings.quiet_hours_enabled) return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const [startHour, startMin] = settings.quiet_hours_start.split(':').map(Number);
        const [endHour, endMin] = settings.quiet_hours_end.split(':').map(Number);
        
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        if (startTime < endTime) {
            return currentTime >= startTime && currentTime <= endTime;
        } else {
            // 자정을 넘나드는 경우
            return currentTime >= startTime || currentTime <= endTime;
        }
    }

    // 센서 임계값 삭제
    async deleteThreshold(sensorType) {
        try {
            const [result] = await db.query(
                'DELETE FROM sensor_thresholds WHERE sensor_type = ?',
                [sensorType]
            );

            if (result.affectedRows > 0) {
                console.log(`✅ 센서 임계값 삭제: ${sensorType}`);
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('임계값 삭제 오류:', error);
            throw error;
        }
    }
}

module.exports = new SensorAnomalyService(); 