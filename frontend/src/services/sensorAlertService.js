import api from './api';
import { io } from 'socket.io-client';

class SensorAlertService {
    constructor() {
        this.socket = null;
        this.listeners = [];
        this.isConnected = false;
        this.alertSound = null;
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
            console.log('센서 알림 서비스 Socket.IO 연결됨');
            this.isConnected = true;
            // 센서 알림 룸에 참가
            this.socket.emit('join_sensor_alerts', userId);
        });

        this.socket.on('disconnect', () => {
            console.log('센서 알림 서비스 Socket.IO 연결 해제됨');
            this.isConnected = false;
        });

        // 새 센서 이상치 알림 수신
        this.socket.on('sensor_anomaly_alert', (alert) => {
            console.log('새로운 센서 이상치 알림 수신:', alert);
            this.notifyListeners('new_sensor_alert', alert);
            this.showBrowserNotification(alert);
            this.playAlertSound(alert.severity);
        });

        return this.socket;
    }

    // 브라우저 알림 표시
    showBrowserNotification(alert) {
        if (!('Notification' in window)) {
            console.log('이 브라우저는 데스크톱 알림을 지원하지 않습니다.');
            return;
        }

        if (Notification.permission === 'granted') {
            const severityEmoji = this.getSeverityEmoji(alert.severity);
            const browserNotification = new Notification(
                `${severityEmoji} ${alert.sensor_name} 이상치 감지`, 
                {
                    body: alert.message,
                    icon: '/favicon.ico',
                    tag: `sensor-alert-${alert.id}`,
                    badge: '/favicon.ico',
                    requireInteraction: alert.severity === 'critical' // 심각한 알림은 사용자 상호작용 필요
                }
            );

            // 클릭 시 센서 알림 페이지로 이동
            browserNotification.onclick = () => {
                window.focus();
                window.location.href = '/sensor-alerts';
                browserNotification.close();
            };

            // 자동 닫기 (심각한 알림은 더 오래 표시)
            const autoCloseTime = alert.severity === 'critical' ? 10000 : 5000;
            setTimeout(() => {
                browserNotification.close();
            }, autoCloseTime);
        }
    }

    // 알림 소리 재생
    playAlertSound(severity) {
        try {
            // 심각도에 따른 다른 소리 (실제 구현에서는 오디오 파일 사용)
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // 심각도에 따른 주파수 설정
            const frequencies = {
                'low': 440,      // A4
                'medium': 523,   // C5
                'high': 659,     // E5
                'critical': 880  // A5
            };

            oscillator.frequency.setValueAtTime(frequencies[severity] || 440, audioContext.currentTime);
            oscillator.type = severity === 'critical' ? 'sawtooth' : 'sine';

            // 볼륨 설정
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);

            // 심각한 알림은 두 번 울림
            if (severity === 'critical') {
                setTimeout(() => {
                    const oscillator2 = audioContext.createOscillator();
                    const gainNode2 = audioContext.createGain();
                    oscillator2.connect(gainNode2);
                    gainNode2.connect(audioContext.destination);
                    oscillator2.frequency.setValueAtTime(880, audioContext.currentTime);
                    oscillator2.type = 'sawtooth';
                    gainNode2.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                    oscillator2.start(audioContext.currentTime);
                    oscillator2.stop(audioContext.currentTime + 0.5);
                }, 600);
            }
        } catch (error) {
            console.warn('알림 소리 재생 실패:', error);
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

    // 센서 알림 목록 조회
    async getAlerts(options = {}) {
        try {
            const params = new URLSearchParams();
            
            if (options.limit) params.append('limit', options.limit);
            if (options.offset) params.append('offset', options.offset);
            if (options.severity) params.append('severity', options.severity);
            if (options.sensor_type) params.append('sensor_type', options.sensor_type);
            if (options.resolved !== undefined) params.append('resolved', options.resolved);
            if (options.farmno) params.append('farmno', options.farmno);
            if (options.zone) params.append('zone', options.zone);

            const response = await api.get(`/sensor-alerts/alerts?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('센서 알림 목록 조회 실패:', error);
            throw error;
        }
    }

    // 미해결 알림 수 조회
    async getUnresolvedCount() {
        try {
            const response = await api.get('/sensor-alerts/alerts/unresolved-count');
            return response.data.data.unresolved_count;
        } catch (error) {
            console.error('미해결 알림 수 조회 실패:', error);
            throw error;
        }
    }

    // 알림 해결 처리
    async resolveAlert(alertId) {
        try {
            const response = await api.put(`/sensor-alerts/alerts/${alertId}/resolve`);
            this.notifyListeners('alert_resolved', { id: alertId });
            return response.data;
        } catch (error) {
            console.error('알림 해결 처리 실패:', error);
            throw error;
        }
    }

    // 모든 미해결 알림 해결 처리
    async resolveAllAlerts(farmno = '1', zone = 'A') {
        try {
            const response = await api.put(`/sensor-alerts/alerts/resolve-all?farmno=${farmno}&zone=${zone}`);
            this.notifyListeners('all_alerts_resolved', { farmno, zone });
            return response.data;
        } catch (error) {
            console.error('모든 알림 해결 처리 실패:', error);
            throw error;
        }
    }

    // 센서 임계값 설정 조회
    async getThresholds() {
        try {
            const response = await api.get('/sensor-alerts/thresholds');
            return response.data.data;
        } catch (error) {
            console.error('센서 임계값 설정 조회 실패:', error);
            throw error;
        }
    }

    // 새로운 센서 임계값 생성
    async createThreshold(thresholdData) {
        try {
            const response = await api.post('/sensor-alerts/thresholds', thresholdData);
            this.notifyListeners('threshold_created', thresholdData);
            return response.data;
        } catch (error) {
            console.error('센서 임계값 생성 실패:', error);
            throw error;
        }
    }

    // 센서 임계값 설정 업데이트
    async updateThreshold(sensorType, thresholdData) {
        try {
            const response = await api.put(`/sensor-alerts/thresholds/${sensorType}`, thresholdData);
            this.notifyListeners('threshold_updated', { sensorType, thresholdData });
            return response.data;
        } catch (error) {
            console.error('센서 임계값 설정 업데이트 실패:', error);
            throw error;
        }
    }

    // 센서 임계값 삭제
    async deleteThreshold(sensorType) {
        try {
            const response = await api.delete(`/sensor-alerts/thresholds/${sensorType}`);
            this.notifyListeners('threshold_deleted', { sensorType });
            return response.data;
        } catch (error) {
            console.error('센서 임계값 삭제 실패:', error);
            throw error;
        }
    }

    // 알림 설정 조회
    async getSettings() {
        try {
            const response = await api.get('/sensor-alerts/settings');
            return response.data.data;
        } catch (error) {
            console.error('알림 설정 조회 실패:', error);
            throw error;
        }
    }

    // 알림 설정 업데이트
    async updateSettings(settings) {
        try {
            const response = await api.put('/sensor-alerts/settings', settings);
            this.notifyListeners('settings_updated', settings);
            return response.data;
        } catch (error) {
            console.error('알림 설정 업데이트 실패:', error);
            throw error;
        }
    }

    // 테스트 알림 생성
    async createTestAlert(sensorType = 'mq4', value = 55.0) {
        try {
            const response = await api.post('/sensor-alerts/test-alert', {
                sensor_type: sensorType,
                value: value
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
                tag: `sensor-test-notification-${Date.now()}`,
                badge: '/favicon.ico',
                requireInteraction: notificationData.requireInteraction || false
            });

            // 클릭 시 창 포커스
            browserNotification.onclick = () => {
                window.focus();
                browserNotification.close();
            };

            // 센서 알림은 더 오래 표시 (8초 후 자동 닫기)
            setTimeout(() => {
                browserNotification.close();
            }, 8000);
        }
    }

    // 알림 통계 조회
    async getStats(period = '7d') {
        try {
            const response = await api.get(`/sensor-alerts/stats?period=${period}`);
            return response.data.data;
        } catch (error) {
            console.error('알림 통계 조회 실패:', error);
            throw error;
        }
    }

    // 심각도별 이모지 반환
    getSeverityEmoji(severity) {
        switch (severity) {
            case 'low':
                return '⚠️';
            case 'medium':
                return '🟡';
            case 'high':
                return '🟠';
            case 'critical':
                return '🔴';
            default:
                return 'ℹ️';
        }
    }

    // 심각도별 색상 반환
    getSeverityColor(severity) {
        switch (severity) {
            case 'low':
                return 'text-blue-600 dark:text-blue-400';
            case 'medium':
                return 'text-yellow-600 dark:text-yellow-400';
            case 'high':
                return 'text-orange-600 dark:text-orange-400';
            case 'critical':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    }

    // 심각도별 배경 색상 반환
    getSeverityBgColor(severity) {
        switch (severity) {
            case 'low':
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700';
            case 'medium':
                return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
            case 'high':
                return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700';
            case 'critical':
                return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
            default:
                return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700';
        }
    }

    // 센서 타입별 이름 반환
    getSensorDisplayName(sensorType) {
        const sensorNames = {
            'mq4': '메탄 가스',
            'mq136': '황화수소 가스',
            'mq137': '암모니아 가스'
        };
        return sensorNames[sensorType] || sensorType;
    }

    // 알림 타입 설명 반환
    getAlertTypeDescription(alertType) {
        const descriptions = {
            'threshold_violation': '임계값 위반',
            'rapid_change': '급격한 변화',
            'sensor_malfunction': '센서 오작동',
            'data_missing': '데이터 누락'
        };
        return descriptions[alertType] || alertType;
    }

    // 시간 포맷팅
    formatTime(timestamp) {
        try {
            if (!timestamp) {
                return '시간 정보 없음';
            }

            // 다양한 형태의 timestamp 처리
            let date;
            if (typeof timestamp === 'string') {
                // ISO 문자열이나 다른 형태의 문자열 처리
                date = new Date(timestamp);
            } else if (typeof timestamp === 'number') {
                // Unix timestamp 처리 (초 단위인 경우 밀리초로 변환)
                date = timestamp < 10000000000 ? new Date(timestamp * 1000) : new Date(timestamp);
            } else {
                date = new Date(timestamp);
            }

            // Invalid Date 체크
            if (isNaN(date.getTime())) {
                console.warn('Invalid timestamp:', timestamp);
                return '시간 정보 오류';
            }

            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) {
                return '방금 전';
            } else if (diffMins < 60) {
                return `${diffMins}분 전`;
            } else if (diffHours < 24) {
                return `${diffHours}시간 전`;
            } else if (diffDays < 7) {
                return `${diffDays}일 전`;
            } else {
                return date.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch (error) {
            console.error('시간 포맷팅 오류:', error, 'timestamp:', timestamp);
            return '시간 정보 오류';
        }
    }
}

export default new SensorAlertService(); 