import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Settings } from 'lucide-react';
import notificationService from '../../services/notificationService';

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const dropdownRef = useRef(null);

    // 컴포넌트 마운트 시 초기화
    useEffect(() => {
        const userId = 1; // TODO: 실제 사용자 ID로 교체
        
        // Socket.IO 초기화
        notificationService.initializeSocket(userId);
        
        // 브라우저 알림 권한 요청
        notificationService.requestNotificationPermission();
        
        // 초기 데이터 로드
        loadNotifications();
        loadUnreadCount();

        // 이벤트 리스너 등록
        notificationService.addListener('new_notification', handleNewNotification);
        notificationService.addListener('notification_read', handleNotificationRead);
        notificationService.addListener('all_notifications_read', handleAllNotificationsRead);
        notificationService.addListener('notification_deleted', handleNotificationDeleted);

        return () => {
            // 정리
            notificationService.removeListener('new_notification', handleNewNotification);
            notificationService.removeListener('notification_read', handleNotificationRead);
            notificationService.removeListener('all_notifications_read', handleAllNotificationsRead);
            notificationService.removeListener('notification_deleted', handleNotificationDeleted);
            notificationService.disconnect();
        };
    }, []);

    // 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // 알림 목록 로드
    const loadNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationService.getNotifications({
                limit: 20,
                offset: 0
            });
            setNotifications(response.data.notifications);
            setHasMore(response.data.notifications.length >= 20);
        } catch (error) {
            console.error('알림 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    // 읽지 않은 알림 수 로드
    const loadUnreadCount = async () => {
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('읽지 않은 알림 수 로드 실패:', error);
        }
    };

    // 새 알림 수신 처리
    const handleNewNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
    };

    // 알림 읽음 처리
    const handleNotificationRead = ({ id }) => {
        setNotifications(prev => 
            prev.map(notification => 
                notification.id === id 
                    ? { ...notification, is_read: true }
                    : notification
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    // 모든 알림 읽음 처리
    const handleAllNotificationsRead = () => {
        setNotifications(prev => 
            prev.map(notification => ({ ...notification, is_read: true }))
        );
        setUnreadCount(0);
    };

    // 알림 삭제 처리
    const handleNotificationDeleted = ({ id }) => {
        setNotifications(prev => {
            const deletedNotification = prev.find(n => n.id === id);
            if (deletedNotification && !deletedNotification.is_read) {
                setUnreadCount(prevCount => Math.max(0, prevCount - 1));
            }
            return prev.filter(notification => notification.id !== id);
        });
    };

    // 알림 클릭 처리
    const handleNotificationClick = async (notification) => {
        if (!notification.is_read) {
            try {
                await notificationService.markAsRead(notification.id);
            } catch (error) {
                console.error('알림 읽음 처리 실패:', error);
            }
        }

        // 액션 URL이 있으면 해당 페이지로 이동
        if (notification.action_url) {
            window.location.href = notification.action_url;
        }
    };

    // 모든 알림 읽음 처리
    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
        } catch (error) {
            console.error('모든 알림 읽음 처리 실패:', error);
        }
    };

    // 알림 삭제
    const handleDeleteNotification = async (notificationId, event) => {
        event.stopPropagation();
        try {
            await notificationService.deleteNotification(notificationId);
        } catch (error) {
            console.error('알림 삭제 실패:', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* 알림 버튼 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#3a2e5a] transition-colors"
                title="알림"
            >
                <Bell size={20} className="text-gray-600 dark:text-[#b39ddb]" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* 드롭다운 */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-[#2f263d] rounded-xl shadow-lg border border-gray-200 dark:border-[#4a3f6d] z-50 max-h-[600px] overflow-hidden">
                    {/* 헤더 */}
                    <div className="p-4 border-b border-gray-200 dark:border-[#4a3f6d]">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                알림
                            </h3>
                            <div className="flex items-center space-x-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-[#4a3f6d] rounded transition-colors"
                                        title="모두 읽음"
                                    >
                                        <CheckCheck size={16} className="text-gray-600 dark:text-gray-400" />
                                    </button>
                                )}
                                <button
                                    onClick={() => window.location.href = '/notifications/settings'}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-[#4a3f6d] rounded transition-colors"
                                    title="알림 설정"
                                >
                                    <Settings size={16} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>
                        {unreadCount > 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {unreadCount}개의 읽지 않은 알림
                            </p>
                        )}
                    </div>

                    {/* 알림 목록 */}
                    <div className="max-h-[500px] overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">로딩 중...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">알림이 없습니다</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-[#4a3f6d]">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 hover:bg-gray-50 dark:hover:bg-[#3a2e5a] cursor-pointer transition-colors ${
                                            !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0">
                                                <span className="text-2xl">
                                                    {notificationService.getNotificationIcon(notification.type)}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-sm font-medium ${
                                                        notification.is_read 
                                                            ? 'text-gray-700 dark:text-gray-300' 
                                                            : 'text-gray-900 dark:text-white font-semibold'
                                                    }`}>
                                                        {notification.title}
                                                    </p>
                                                    <div className="flex items-center space-x-1">
                                                        {!notification.is_read && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                        )}
                                                        <button
                                                            onClick={(e) => handleDeleteNotification(notification.id, e)}
                                                            className="p-1 hover:bg-gray-200 dark:hover:bg-[#4a3f6d] rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="삭제"
                                                        >
                                                            <Trash2 size={12} className="text-gray-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className={`text-xs px-2 py-1 rounded ${
                                                        notificationService.getNotificationBgColor(notification.type)
                                                    } ${notificationService.getNotificationColor(notification.type)}`}>
                                                        {notification.category}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {notificationService.formatTime(notification.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 푸터 */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 dark:border-[#4a3f6d] bg-gray-50 dark:bg-[#2a2139]">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    window.location.href = '/notifications';
                                }}
                                className="w-full text-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium"
                            >
                                모든 알림 보기
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown; 