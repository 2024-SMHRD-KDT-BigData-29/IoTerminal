import api from './api';
import { io } from 'socket.io-client';

class NotificationService {
    constructor() {
        this.socket = null;
        this.listeners = [];
        this.isConnected = false;
    }

    // Socket.IO 연결 초기화
    initializeSocket(userId) {
        if (this.socket) {
            this.socket.disconnect();
        }

        const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL || 'http://localhost:3001';
        
        this.socket = io(SOCKET_SERVER_URL, {
            transports: ['websocket']
        });

        this.socket.on('connect', () => {
            console.log('알림 서비스 Socket.IO 연결됨');
            this.isConnected = true;
            // 알림 룸에 참가
            this.socket.emit('join_notifications', userId);
        });

        this.socket.on('disconnect', () => {
            console.log('알림 서비스 Socket.IO 연결 해제됨');
            this.isConnected = false;
        });

        // 새 알림 수신
        this.socket.on('new_notification', (notification) => {
            console.log('새로운 실시간 알림 수신:', notification);
            this.notifyListeners('new_notification', notification);
            this.showBrowserNotification(notification);
        });

        return this.socket;
    }

    // 브라우저 알림 표시
    showBrowserNotification(notification) {
        if (!('Notification' in window)) {
            console.log('이 브라우저는 데스크톱 알림을 지원하지 않습니다.');
            return;
        }

        if (Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico', // 프로젝트 아이콘
                tag: `notification-${notification.id}`,
                badge: '/favicon.ico'
            });

            // 클릭 시 해당 페이지로 이동
            browserNotification.onclick = () => {
                window.focus();
                if (notification.action_url) {
                    window.location.href = notification.action_url;
                }
                browserNotification.close();
            };

            // 5초 후 자동 닫기
            setTimeout(() => {
                browserNotification.close();
            }, 5000);
        }
    }

    // 브라우저 알림 권한 요청
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('이 브라우저는 데스크톱 알림을 지원하지 않습니다.');
            return false;
        }

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return Notification.permission === 'granted';
    }

    // 이벤트 리스너 추가
    addListener(event, callback) {
        this.listeners.push({ event, callback });
    }

    // 이벤트 리스너 제거
    removeListener(event, callback) {
        this.listeners = this.listeners.filter(
            listener => !(listener.event === event && listener.callback === callback)
        );
    }

    // 리스너들에게 이벤트 알림
    notifyListeners(event, data) {
        this.listeners.forEach(listener => {
            if (listener.event === event) {
                listener.callback(data);
            }
        });
    }

    // Socket 연결 해제
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
    }

    // API 메서드들

    // 알림 목록 조회
    async getNotifications(options = {}) {
        try {
            const params = new URLSearchParams();
            
            if (options.limit) params.append('limit', options.limit);
            if (options.offset) params.append('offset', options.offset);
            if (options.unreadOnly) params.append('unreadOnly', 'true');
            if (options.category) params.append('category', options.category);
            if (options.type) params.append('type', options.type);

            const response = await api.get(`/notifications?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('알림 목록 조회 실패:', error);
            throw error;
        }
    }

    // 읽지 않은 알림 수 조회
    async getUnreadCount() {
        try {
            const response = await api.get('/notifications/unread-count');
            return response.data.data.unread_count;
        } catch (error) {
            console.error('읽지 않은 알림 수 조회 실패:', error);
            throw error;
        }
    }

    // 알림 읽음 처리
    async markAsRead(notificationId) {
        try {
            const response = await api.put(`/notifications/${notificationId}/read`);
            this.notifyListeners('notification_read', { id: notificationId });
            return response.data;
        } catch (error) {
            console.error('알림 읽음 처리 실패:', error);
            throw error;
        }
    }

    // 모든 알림 읽음 처리
    async markAllAsRead() {
        try {
            const response = await api.put('/notifications/read-all');
            this.notifyListeners('all_notifications_read');
            return response.data;
        } catch (error) {
            console.error('모든 알림 읽음 처리 실패:', error);
            throw error;
        }
    }

    // 알림 삭제
    async deleteNotification(notificationId) {
        try {
            const response = await api.delete(`/notifications/${notificationId}`);
            this.notifyListeners('notification_deleted', { id: notificationId });
            return response.data;
        } catch (error) {
            console.error('알림 삭제 실패:', error);
            throw error;
        }
    }

    // 알림 설정 조회
    async getSettings() {
        try {
            const response = await api.get('/notifications/settings');
            return response.data.data;
        } catch (error) {
            console.error('알림 설정 조회 실패:', error);
            throw error;
        }
    }

    // 알림 설정 업데이트
    async updateSettings(settings) {
        try {
            const response = await api.put('/notifications/settings', settings);
            this.notifyListeners('settings_updated', settings);
            return response.data;
        } catch (error) {
            console.error('알림 설정 업데이트 실패:', error);
            throw error;
        }
    }

    // 테스트 알림 생성
    async createTestNotification(templateKey = 'welcome', customData = {}) {
        try {
            const response = await api.post('/notifications/test', {
                templateKey,
                customData
            });
            
            // 브라우저 알림 표시
            if (response.data.showBrowserNotification && response.data.notificationData) {
                await this.showTestBrowserNotification(response.data.notificationData);
            }
            
            return response.data;
        } catch (error) {
            console.error('테스트 알림 생성 실패:', error);
            throw error;
        }
    }

    // 테스트용 브라우저 알림 표시
    async showTestBrowserNotification(notificationData) {
        // 브라우저 알림 권한 요청
        if (!('Notification' in window)) {
            console.log('이 브라우저는 데스크톱 알림을 지원하지 않습니다.');
            return;
        }

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('알림 권한이 거부되었습니다.');
                return;
            }
        }

        if (Notification.permission === 'granted') {
            const browserNotification = new Notification(notificationData.title, {
                body: notificationData.message,
                icon: notificationData.icon || '/favicon.ico',
                tag: `test-notification-${Date.now()}`,
                badge: '/favicon.ico',
                requireInteraction: notificationData.requireInteraction || false
            });

            // 클릭 시 창 포커스
            browserNotification.onclick = () => {
                window.focus();
                browserNotification.close();
            };

            // 자동 닫기 (5초 후)
            setTimeout(() => {
                browserNotification.close();
            }, 5000);
        }
    }

    // 알림 타입별 아이콘 반환
    getNotificationIcon(type) {
        switch (type) {
            case 'success':
                return '✅';
            case 'warning':
                return '⚠️';
            case 'error':
                return '❌';
            case 'info':
            default:
                return 'ℹ️';
        }
    }

    // 알림 타입별 색상 반환
    getNotificationColor(type) {
        switch (type) {
            case 'success':
                return 'text-green-600 dark:text-green-400';
            case 'warning':
                return 'text-yellow-600 dark:text-yellow-400';
            case 'error':
                return 'text-red-600 dark:text-red-400';
            case 'info':
            default:
                return 'text-blue-600 dark:text-blue-400';
        }
    }

    // 알림 카테고리별 배경 색상 반환
    getNotificationBgColor(type) {
        switch (type) {
            case 'success':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
            case 'warning':
                return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
            case 'error':
                return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
            case 'info':
            default:
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700';
        }
    }

    // 시간 포맷팅
    formatTime(timestamp) {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffMs = now - notificationTime;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) {
            return '방금 전';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}분 전`;
        } else if (diffHours < 24) {
            return `${diffHours}시간 전`;
        } else if (diffDays < 7) {
            return `${diffDays}일 전`;
        } else {
            return notificationTime.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }
}

export default new NotificationService(); 