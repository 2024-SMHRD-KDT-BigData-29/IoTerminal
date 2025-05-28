const db = require('../config/database');

class NotificationService {
    // 알림 생성
    async createNotification(userId, templateKey, customData = {}) {
        try {
            // 템플릿에서 기본 정보 가져오기
            const [templateRows] = await db.query(
                'SELECT * FROM notification_templates WHERE template_key = ? AND is_active = TRUE',
                [templateKey]
            );

            if (templateRows.length === 0) {
                throw new Error(`알림 템플릿을 찾을 수 없습니다: ${templateKey}`);
            }

            const template = templateRows[0];
            
            // 사용자 알림 설정 확인
            const settings = await this.getUserNotificationSettings(userId);
            
            // 카테고리별 알림 설정 확인
            if (!this.shouldSendNotification(template.category, settings)) {
                console.log(`알림 설정에 의해 차단됨: 사용자 ${userId}, 카테고리 ${template.category}`);
                return null;
            }

            // 조용한 시간 확인
            if (settings.quiet_hours_enabled && this.isQuietHours(settings)) {
                console.log(`조용한 시간에 의해 차단됨: 사용자 ${userId}`);
                return null;
            }

            // 메시지와 제목 커스터마이징
            let title = template.title;
            let message = template.message;
            
            if (customData.title) title = customData.title;
            if (customData.message) message = customData.message;
            
            // 플레이스홀더 교체
            if (customData.placeholders) {
                for (const [key, value] of Object.entries(customData.placeholders)) {
                    title = title.replace(`{${key}}`, value);
                    message = message.replace(`{${key}}`, value);
                }
            }

            // 알림 삽입
            const [result] = await db.query(
                `INSERT INTO notifications 
                (user_id, title, message, type, category, action_url, metadata) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    title,
                    message,
                    customData.type || template.type,
                    template.category,
                    customData.action_url || null,
                    customData.metadata ? JSON.stringify(customData.metadata) : null
                ]
            );

            const notification = {
                id: result.insertId,
                user_id: userId,
                title,
                message,
                type: customData.type || template.type,
                category: template.category,
                is_read: false,
                created_at: new Date(),
                action_url: customData.action_url || null,
                metadata: customData.metadata || null
            };

            console.log(`알림 생성됨: 사용자 ${userId}, 템플릿 ${templateKey}`);
            return notification;

        } catch (error) {
            console.error('알림 생성 오류:', error);
            throw error;
        }
    }

    // 센서 값 기반 알림 체크
    async checkSensorAlerts(sensorData) {
        try {
            // 모든 사용자의 설정 조회
            const [userSettings] = await db.query(
                'SELECT * FROM notification_settings WHERE sensor_alerts = TRUE AND sensor_threshold_enabled = TRUE'
            );

            for (const settings of userSettings) {
                for (const [sensorType, value] of Object.entries(sensorData)) {
                    if (typeof value === 'number') {
                        // 임계값 초과 체크
                        if (value > settings.sensor_threshold_max) {
                            await this.createNotification(settings.user_id, 'sensor_high_value', {
                                placeholders: {
                                    sensor_type: sensorType,
                                    value: value,
                                    threshold: settings.sensor_threshold_max
                                },
                                metadata: {
                                    sensor_type: sensorType,
                                    sensor_value: value,
                                    threshold_type: 'max',
                                    threshold_value: settings.sensor_threshold_max
                                }
                            });
                        }
                        
                        // 임계값 미달 체크
                        if (value < settings.sensor_threshold_min) {
                            await this.createNotification(settings.user_id, 'sensor_low_value', {
                                placeholders: {
                                    sensor_type: sensorType,
                                    value: value,
                                    threshold: settings.sensor_threshold_min
                                },
                                metadata: {
                                    sensor_type: sensorType,
                                    sensor_value: value,
                                    threshold_type: 'min',
                                    threshold_value: settings.sensor_threshold_min
                                }
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('센서 알림 체크 오류:', error);
        }
    }

    // 사용자 알림 목록 조회
    async getUserNotifications(userId, options = {}) {
        try {
            const {
                limit = 50,
                offset = 0,
                unreadOnly = false,
                category = null,
                type = null
            } = options;

            let whereClause = 'WHERE user_id = ?';
            const params = [userId];

            if (unreadOnly) {
                whereClause += ' AND is_read = FALSE';
            }

            if (category) {
                whereClause += ' AND category = ?';
                params.push(category);
            }

            if (type) {
                whereClause += ' AND type = ?';
                params.push(type);
            }

            const [notifications] = await db.query(
                `SELECT * FROM notifications 
                ${whereClause} 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?`,
                [...params, limit, offset]
            );

            // 읽지 않은 알림 수 조회
            const [countResult] = await db.query(
                'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
                [userId]
            );

            return {
                notifications: notifications.map(n => ({
                    ...n,
                    metadata: n.metadata ? JSON.parse(n.metadata) : null
                })),
                unread_count: countResult[0].unread_count
            };

        } catch (error) {
            console.error('알림 조회 오류:', error);
            throw error;
        }
    }

    // 알림 읽음 처리
    async markNotificationAsRead(notificationId, userId) {
        try {
            const [result] = await db.query(
                'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
                [notificationId, userId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('알림 읽음 처리 오류:', error);
            throw error;
        }
    }

    // 모든 알림 읽음 처리
    async markAllNotificationsAsRead(userId) {
        try {
            const [result] = await db.query(
                'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
                [userId]
            );

            return result.affectedRows;
        } catch (error) {
            console.error('모든 알림 읽음 처리 오류:', error);
            throw error;
        }
    }

    // 알림 삭제
    async deleteNotification(notificationId, userId) {
        try {
            const [result] = await db.query(
                'DELETE FROM notifications WHERE id = ? AND user_id = ?',
                [notificationId, userId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('알림 삭제 오류:', error);
            throw error;
        }
    }

    // 사용자 알림 설정 조회
    async getUserNotificationSettings(userId) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM notification_settings WHERE user_id = ?',
                [userId]
            );

            if (rows.length === 0) {
                // 기본 설정 생성
                return await this.createDefaultNotificationSettings(userId);
            }

            return rows[0];
        } catch (error) {
            console.error('알림 설정 조회 오류:', error);
            throw error;
        }
    }

    // 기본 알림 설정 생성
    async createDefaultNotificationSettings(userId) {
        try {
            await db.query(
                'INSERT INTO notification_settings (user_id) VALUES (?)',
                [userId]
            );

            return await this.getUserNotificationSettings(userId);
        } catch (error) {
            console.error('기본 알림 설정 생성 오류:', error);
            throw error;
        }
    }

    // 알림 설정 업데이트
    async updateNotificationSettings(userId, settings) {
        try {
            const allowedFields = [
                'email_enabled', 'push_enabled', 'sensor_alerts', 'device_alerts',
                'system_alerts', 'workflow_alerts', 'sensor_threshold_enabled',
                'sensor_threshold_min', 'sensor_threshold_max', 'quiet_hours_enabled',
                'quiet_hours_start', 'quiet_hours_end'
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
                `UPDATE notification_settings SET ${updateFields.join(', ')} WHERE user_id = ?`,
                params
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('알림 설정 업데이트 오류:', error);
            throw error;
        }
    }

    // 카테고리별 알림 전송 여부 확인
    shouldSendNotification(category, settings) {
        switch (category) {
            case 'sensor':
                return settings.sensor_alerts;
            case 'device':
                return settings.device_alerts;
            case 'system':
                return settings.system_alerts;
            case 'workflow':
                return settings.workflow_alerts;
            default:
                return true;
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
            // 같은 날 내 (예: 22:00 - 08:00 다음날)
            return currentTime >= startTime && currentTime <= endTime;
        } else {
            // 자정을 넘나드는 경우 (예: 22:00 - 08:00)
            return currentTime >= startTime || currentTime <= endTime;
        }
    }

    // 시스템 알림 생성 (관리자용)
    async createSystemNotification(templateKey, customData = {}) {
        try {
            // 모든 활성 사용자에게 알림 전송
            const [users] = await db.query(
                'SELECT DISTINCT user_id FROM notification_settings WHERE system_alerts = TRUE'
            );

            const notifications = [];
            for (const user of users) {
                const notification = await this.createNotification(user.user_id, templateKey, customData);
                if (notification) {
                    notifications.push(notification);
                }
            }

            return notifications;
        } catch (error) {
            console.error('시스템 알림 생성 오류:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService(); 