import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X, Check, Settings, TestTube, CheckCheck } from 'lucide-react';
import sensorAlertService from '../../services/sensorAlertService';

const SensorAlertDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [unresolvedCount, setUnresolvedCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [resolvingAll, setResolvingAll] = useState(false);
    const dropdownRef = useRef(null);

    // 컴포넌트 마운트 시 초기화
    useEffect(() => {
        const userId = 1; // TODO: 실제 사용자 ID로 교체
        
        // Socket.IO 초기화
        sensorAlertService.initializeSocket(userId);
        
        // 브라우저 알림 권한 요청
        sensorAlertService.requestNotificationPermission();
        
        // 초기 데이터 로드
        loadAlerts();
        loadUnresolvedCount();

        // 이벤트 리스너 등록
        sensorAlertService.addListener('new_sensor_alert', handleNewAlert);
        sensorAlertService.addListener('alert_resolved', handleAlertResolved);

        return () => {
            // 정리
            sensorAlertService.removeListener('new_sensor_alert', handleNewAlert);
            sensorAlertService.removeListener('alert_resolved', handleAlertResolved);
            sensorAlertService.disconnect();
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
    const loadAlerts = async () => {
        try {
            setLoading(true);
            const response = await sensorAlertService.getAlerts({
                limit: 20,
                offset: 0,
                resolved: false // 미해결 알림만
            });
            
            console.log('API 응답:', response); // 디버깅용
            
            // API 응답 구조 확인 후 올바른 데이터 추출
            const alertsData = response?.data?.alerts || response?.alerts || [];
            const unresolvedCountData = response?.data?.unresolved_count || response?.unresolved_count || 0;
            
            setAlerts(Array.isArray(alertsData) ? alertsData : []);
            setUnresolvedCount(unresolvedCountData);
        } catch (error) {
            console.error('센서 알림 로드 실패:', error);
            setAlerts([]);
            setUnresolvedCount(0);
        } finally {
            setLoading(false);
        }
    };

    // 미해결 알림 수 로드
    const loadUnresolvedCount = async () => {
        try {
            const count = await sensorAlertService.getUnresolvedCount();
            setUnresolvedCount(count);
        } catch (error) {
            console.error('미해결 알림 수 로드 실패:', error);
        }
    };

    // 새 알림 수신 처리
    const handleNewAlert = (alert) => {
        setAlerts(prev => [alert, ...prev]);
        setUnresolvedCount(prev => prev + 1);
    };

    // 알림 해결 처리
    const handleAlertResolved = ({ id }) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
        setUnresolvedCount(prev => Math.max(0, prev - 1));
    };

    // 개별 알림 해결 처리
    const handleResolveAlert = async (alertId, event) => {
        event.stopPropagation();
        try {
            await sensorAlertService.resolveAlert(alertId);
        } catch (error) {
            console.error('알림 해결 처리 실패:', error);
        }
    };

    // 모든 알림 해결 처리
    const handleResolveAllAlerts = async () => {
        if (alerts.length === 0) return;
        
        try {
            setResolvingAll(true);
            
            // 새로운 API를 사용하여 한 번에 모든 알림 해결
            const response = await sensorAlertService.resolveAllAlerts('1', 'A');
            
            // 상태 업데이트
            setAlerts([]);
            setUnresolvedCount(0);
            
            console.log(`✅ ${response.data.resolved_count}개의 알림이 해결되었습니다.`);
            
        } catch (error) {
            console.error('모든 알림 해결 처리 실패:', error);
            // 실패 시 다시 로드
            await loadAlerts();
        } finally {
            setResolvingAll(false);
        }
    };

    // 테스트 알림 생성
    const handleCreateTestAlert = async () => {
        try {
            await sensorAlertService.createTestAlert('mq4', 55.0);
            setIsOpen(false);
        } catch (error) {
            console.error('테스트 알림 생성 실패:', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* 센서 알림 버튼 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#3a2e5a] transition-colors"
                title="센서 이상치 알림"
            >
                <AlertTriangle size={20} className="text-gray-600 dark:text-[#b39ddb]" />
                {unresolvedCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
                        {unresolvedCount > 99 ? '99+' : unresolvedCount}
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
                                센서 이상치 알림
                            </h3>
                            <div className="flex items-center space-x-2">
                                {alerts.length > 0 && (
                                    <button
                                        onClick={handleResolveAllAlerts}
                                        disabled={resolvingAll}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-[#4a3f6d] rounded transition-colors disabled:opacity-50"
                                        title="모든 알림 해결"
                                    >
                                        {resolvingAll ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                                        ) : (
                                            <CheckCheck size={16} className="text-green-600 dark:text-green-400" />
                                        )}
                                    </button>
                                )}
                                <button
                                    onClick={handleCreateTestAlert}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-[#4a3f6d] rounded transition-colors"
                                    title="테스트 알림"
                                >
                                    <TestTube size={16} className="text-gray-600 dark:text-gray-400" />
                                </button>
                                <button
                                    onClick={() => window.location.href = '/settings'}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-[#4a3f6d] rounded transition-colors"
                                    title="알림 설정"
                                >
                                    <Settings size={16} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>
                        {unresolvedCount > 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {unresolvedCount}개의 미해결 알림
                            </p>
                        )}
                    </div>

                    {/* 알림 목록 */}
                    <div className="max-h-[500px] overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">로딩 중...</p>
                            </div>
                        ) : alerts.length === 0 ? (
                            <div className="p-8 text-center">
                                <AlertTriangle size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">센서 이상치 알림이 없습니다</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    모든 센서가 정상 범위에서 작동 중입니다
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-[#4a3f6d]">
                                {alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={`p-4 hover:bg-gray-50 dark:hover:bg-[#3a2e5a] transition-colors ${
                                            sensorAlertService.getSeverityBgColor(alert.severity)
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0">
                                                <span className="text-2xl">
                                                    {sensorAlertService.getSeverityEmoji(alert.severity)}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {alert.sensor_name}
                                                    </p>
                                                    <div className="flex items-center space-x-1">
                                                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                                                            sensorAlertService.getSeverityColor(alert.severity)
                                                        }`}>
                                                            {alert.severity.toUpperCase()}
                                                        </span>
                                                        <button
                                                            onClick={(e) => handleResolveAlert(alert.id, e)}
                                                            className="p-1 hover:bg-gray-200 dark:hover:bg-[#4a3f6d] rounded transition-colors"
                                                            title="해결 처리"
                                                        >
                                                            <Check size={12} className="text-green-600" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                    {alert.message}
                                                </p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                                                            {sensorAlertService.getAlertTypeDescription(alert.alert_type)}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            현재값: {alert.current_value}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {sensorAlertService.formatTime(alert.created_at)}
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
                    {alerts.length > 0 && (
                        <div className="p-3 border-t border-gray-200 dark:border-[#4a3f6d] bg-gray-50 dark:bg-[#2a2139]">
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        window.location.href = '/sensor-alerts';
                                    }}
                                    className="flex-1 text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium py-2 px-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    모든 센서 알림 보기
                                </button>
                                <button
                                    onClick={handleResolveAllAlerts}
                                    disabled={resolvingAll}
                                    className="flex-1 text-center text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium py-2 px-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {resolvingAll ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2"></div>
                                            처리 중...
                                        </div>
                                    ) : (
                                        '모든 알림 해결'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SensorAlertDropdown; 