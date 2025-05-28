const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');

// 인증 미들웨어 (임시로 사용자 ID를 1로 고정)
const authenticateUser = (req, res, next) => {
    // TODO: 실제 JWT 토큰 검증 로직으로 교체
    req.userId = 1; // 임시로 사용자 ID 1로 고정
    next();
};

// 사용자 알림 목록 조회
router.get('/', authenticateUser, async (req, res) => {
    try {
        const {
            limit = 50,
            offset = 0,
            unreadOnly = false,
            category,
            type
        } = req.query;

        const options = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            unreadOnly: unreadOnly === 'true',
            category,
            type
        };

        const result = await notificationService.getUserNotifications(req.userId, options);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('알림 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 목록을 조회하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 읽지 않은 알림 수 조회
router.get('/unread-count', authenticateUser, async (req, res) => {
    try {
        const result = await notificationService.getUserNotifications(req.userId, {
            limit: 1,
            unreadOnly: true
        });
        
        res.json({
            success: true,
            data: {
                unread_count: result.unread_count
            }
        });
    } catch (error) {
        console.error('읽지 않은 알림 수 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '읽지 않은 알림 수를 조회하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 읽음 처리
router.put('/:id/read', authenticateUser, async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);
        const success = await notificationService.markNotificationAsRead(notificationId, req.userId);
        
        if (success) {
            res.json({
                success: true,
                message: '알림을 읽음으로 처리했습니다.'
            });
        } else {
            res.status(404).json({
                success: false,
                message: '해당 알림을 찾을 수 없습니다.'
            });
        }
    } catch (error) {
        console.error('알림 읽음 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림을 읽음으로 처리하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 모든 알림 읽음 처리
router.put('/read-all', authenticateUser, async (req, res) => {
    try {
        const count = await notificationService.markAllNotificationsAsRead(req.userId);
        
        res.json({
            success: true,
            message: `${count}개의 알림을 읽음으로 처리했습니다.`,
            data: {
                updated_count: count
            }
        });
    } catch (error) {
        console.error('모든 알림 읽음 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '모든 알림을 읽음으로 처리하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 삭제
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);
        const success = await notificationService.deleteNotification(notificationId, req.userId);
        
        if (success) {
            res.json({
                success: true,
                message: '알림을 삭제했습니다.'
            });
        } else {
            res.status(404).json({
                success: false,
                message: '해당 알림을 찾을 수 없습니다.'
            });
        }
    } catch (error) {
        console.error('알림 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림을 삭제하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 설정 조회
router.get('/settings', authenticateUser, async (req, res) => {
    try {
        const settings = await notificationService.getUserNotificationSettings(req.userId);
        
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
        const success = await notificationService.updateNotificationSettings(req.userId, req.body);
        
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

// 테스트용 알림 생성
router.post('/test', authenticateUser, async (req, res) => {
    try {
        const { templateKey = 'welcome', customData = {} } = req.body;
        
        const notification = await notificationService.createNotification(
            req.userId,
            templateKey,
            customData
        );
        
        if (notification) {
            res.json({
                success: true,
                message: '테스트 알림이 생성되었습니다.',
                data: notification
            });
        } else {
            res.json({
                success: false,
                message: '알림 설정에 의해 알림이 차단되었습니다.'
            });
        }
    } catch (error) {
        console.error('테스트 알림 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '테스트 알림을 생성하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 시스템 알림 생성 (관리자용)
router.post('/system', async (req, res) => {
    try {
        const { templateKey, customData = {} } = req.body;
        
        if (!templateKey) {
            return res.status(400).json({
                success: false,
                message: '템플릿 키가 필요합니다.'
            });
        }
        
        const notifications = await notificationService.createSystemNotification(templateKey, customData);
        
        res.json({
            success: true,
            message: `${notifications.length}명의 사용자에게 시스템 알림을 전송했습니다.`,
            data: {
                sent_count: notifications.length
            }
        });
    } catch (error) {
        console.error('시스템 알림 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '시스템 알림을 생성하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router; 