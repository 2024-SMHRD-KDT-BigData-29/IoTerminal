const express = require('express');
const router = express.Router();

// 임시 데이터 저장소 (실제로는 데이터베이스를 사용해야 함)
let notifications = [];
let settings = {
    email_enabled: true,
    push_enabled: true,
    sensor_alerts: true,
    device_alerts: true,
    system_alerts: true,
    workflow_alerts: true,
    sensor_threshold_enabled: true,
    sensor_threshold_min: 0.00,
    sensor_threshold_max: 100.00,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
};

// 알림 목록 조회
router.get('/', (req, res) => {
    try {
        const { limit = 50, offset = 0, unreadOnly, category, type } = req.query;
        
        let filteredNotifications = [...notifications];
        
        if (unreadOnly === 'true') {
            filteredNotifications = filteredNotifications.filter(n => !n.is_read);
        }
        
        if (category) {
            filteredNotifications = filteredNotifications.filter(n => n.category === category);
        }
        
        if (type) {
            filteredNotifications = filteredNotifications.filter(n => n.type === type);
        }
        
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            data: {
                notifications: paginatedNotifications,
                total: filteredNotifications.length,
                hasMore: endIndex < filteredNotifications.length
            }
        });
    } catch (error) {
        console.error('알림 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 목록을 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 읽지 않은 알림 수 조회
router.get('/unread-count', (req, res) => {
    try {
        const unreadCount = notifications.filter(n => !n.is_read).length;
        res.json({
            success: true,
            data: {
                unread_count: unreadCount
            }
        });
    } catch (error) {
        console.error('읽지 않은 알림 수 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '읽지 않은 알림 수를 조회하는 중 오류가 발생했습니다.'
        });
    }
});

// 알림 읽음 처리
router.put('/:id/read', (req, res) => {
    try {
        const { id } = req.params;
        const notification = notifications.find(n => n.id === parseInt(id));
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: '알림을 찾을 수 없습니다.'
            });
        }
        
        notification.is_read = true;
        notification.read_at = new Date().toISOString();
        
        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('알림 읽음 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 읽음 처리 중 오류가 발생했습니다.'
        });
    }
});

// 모든 알림 읽음 처리
router.put('/read-all', (req, res) => {
    try {
        const currentTime = new Date().toISOString();
        notifications.forEach(notification => {
            if (!notification.is_read) {
                notification.is_read = true;
                notification.read_at = currentTime;
            }
        });
        
        res.json({
            success: true,
            message: '모든 알림이 읽음 처리되었습니다.'
        });
    } catch (error) {
        console.error('모든 알림 읽음 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '모든 알림 읽음 처리 중 오류가 발생했습니다.'
        });
    }
});

// 알림 삭제
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const index = notifications.findIndex(n => n.id === parseInt(id));
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: '알림을 찾을 수 없습니다.'
            });
        }
        
        notifications.splice(index, 1);
        
        res.json({
            success: true,
            message: '알림이 삭제되었습니다.'
        });
    } catch (error) {
        console.error('알림 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 삭제 중 오류가 발생했습니다.'
        });
    }
});

// 알림 설정 조회
router.get('/settings', (req, res) => {
    try {
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('알림 설정 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 설정을 조회하는 중 오류가 발생했습니다.'
        });
    }
});

// 알림 설정 업데이트
router.put('/settings', (req, res) => {
    try {
        const updatedSettings = req.body;
        settings = { ...settings, ...updatedSettings };
        
        res.json({
            success: true,
            data: settings,
            message: '알림 설정이 업데이트되었습니다.'
        });
    } catch (error) {
        console.error('알림 설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 설정 업데이트 중 오류가 발생했습니다.'
        });
    }
});

// 테스트 알림 생성
router.post('/test', (req, res) => {
    try {
        const { templateKey = 'welcome', customData = {} } = req.body;
        
        const testNotification = {
            id: Date.now(),
            title: customData.title || '테스트 알림',
            message: customData.message || '알림 시스템이 정상적으로 작동하고 있습니다.',
            type: customData.type || 'success',
            category: 'system',
            is_read: false,
            created_at: new Date().toISOString(),
            action_url: null,
            metadata: { ...customData, isTest: true }
        };
        
        notifications.unshift(testNotification);
        
        res.json({
            success: true,
            data: testNotification,
            message: '테스트 알림이 생성되었습니다.'
        });
    } catch (error) {
        console.error('테스트 알림 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '테스트 알림 생성 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router; 