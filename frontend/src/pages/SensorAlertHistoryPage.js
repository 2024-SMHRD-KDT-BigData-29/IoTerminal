import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Filter, Search, Eye, EyeOff, Trash2, RefreshCw, BarChart3, TrendingUp, Activity } from 'lucide-react';
import sensorAlertService from '../services/sensorAlertService';

const SensorAlertHistoryPage = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [unresolvedCount, setUnresolvedCount] = useState(0);
    const [message, setMessage] = useState('');
    const [stats, setStats] = useState(null);
    const [statsPeriod, setStatsPeriod] = useState('7d');
    
    // 필터 상태
    const [filters, setFilters] = useState({
        severity: '',
        sensor_type: '',
        resolved: '',
        search: ''
    });
    
    // 페이지네이션
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    
    // 선택된 알림들
    const [selectedAlerts, setSelectedAlerts] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        loadAlerts();
        loadStats();
    }, [currentPage, filters, statsPeriod]);

    // 알림 목록 로드
    const loadAlerts = async () => {
        try {
            setLoading(true);
            const options = {
                limit: itemsPerPage,
                offset: (currentPage - 1) * itemsPerPage,
                ...filters
            };
            
            // 검색어가 있으면 제거 (백엔드에서 지원하지 않음)
            delete options.search;
            
            const result = await sensorAlertService.getAlerts(options);
            
            console.log('API 응답:', result); // 디버깅용
            
            // API 응답 구조 확인 후 올바른 데이터 추출
            const alertsData = result?.data?.alerts || result?.alerts || [];
            const unresolvedCountData = result?.data?.unresolved_count || result?.unresolved_count || 0;
            
            // 검색어 필터링 (프론트엔드에서)
            let filteredAlerts = Array.isArray(alertsData) ? alertsData : [];
            if (filters.search && filteredAlerts.length > 0) {
                const searchLower = filters.search.toLowerCase();
                filteredAlerts = filteredAlerts.filter(alert => 
                    alert.sensor_name?.toLowerCase().includes(searchLower) ||
                    alert.message?.toLowerCase().includes(searchLower) ||
                    alert.sensor_type?.toLowerCase().includes(searchLower)
                );
            }
            
            setAlerts(filteredAlerts);
            setTotalCount(filteredAlerts.length);
            setUnresolvedCount(unresolvedCountData);
        } catch (error) {
            console.error('알림 목록 로드 실패:', error);
            setMessage('알림 목록을 불러오는 중 오류가 발생했습니다.');
            setAlerts([]);
            setTotalCount(0);
            setUnresolvedCount(0);
        } finally {
            setLoading(false);
        }
    };

    // 통계 로드
    const loadStats = async () => {
        try {
            const statsData = await sensorAlertService.getStats(statsPeriod);
            console.log('통계 API 응답:', statsData); // 디버깅용
            setStats(statsData || {});
        } catch (error) {
            console.error('통계 로드 실패:', error);
            setStats({});
        }
    };

    // 필터 변경
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setCurrentPage(1);
    };

    // 통계 기간 변경
    const handleStatsPeriodChange = (period) => {
        setStatsPeriod(period);
    };

    // 알림 해결 처리
    const handleResolveAlert = async (alertId) => {
        try {
            await sensorAlertService.resolveAlert(alertId);
            setMessage('알림이 해결 처리되었습니다.');
            setTimeout(() => setMessage(''), 3000);
            loadAlerts();
            loadStats(); // 통계도 새로고침
        } catch (error) {
            console.error('알림 해결 처리 실패:', error);
            setMessage('알림 해결 처리 중 오류가 발생했습니다.');
        }
    };

    // 선택된 알림들 일괄 해결
    const handleBulkResolve = async () => {
        if (!Array.isArray(selectedAlerts) || selectedAlerts.length === 0) return;
        
        try {
            for (const alertId of selectedAlerts) {
                await sensorAlertService.resolveAlert(alertId);
            }
            setMessage(`${selectedAlerts.length}개의 알림이 해결 처리되었습니다.`);
            setTimeout(() => setMessage(''), 3000);
            setSelectedAlerts([]);
            setSelectAll(false);
            loadAlerts();
            loadStats(); // 통계도 새로고침
        } catch (error) {
            console.error('일괄 해결 처리 실패:', error);
            setMessage('일괄 해결 처리 중 오류가 발생했습니다.');
        }
    };

    // 체크박스 선택 처리
    const handleSelectAlert = (alertId) => {
        setSelectedAlerts(prev => {
            const currentSelected = Array.isArray(prev) ? prev : [];
            if (currentSelected.includes(alertId)) {
                return currentSelected.filter(id => id !== alertId);
            } else {
                return [...currentSelected, alertId];
            }
        });
    };

    // 전체 선택/해제
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedAlerts([]);
        } else {
            const alertsArray = Array.isArray(alerts) ? alerts : [];
            const unresolvedAlerts = alertsArray.filter(alert => !alert.is_resolved);
            setSelectedAlerts(unresolvedAlerts.map(alert => alert.id));
        }
        setSelectAll(!selectAll);
    };

    // 심각도별 색상 클래스
    const getSeverityClass = (severity) => {
        switch (severity) {
            case 'low':
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300';
            case 'medium':
                return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300';
            case 'high':
                return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-800 dark:text-orange-300';
            case 'critical':
                return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300';
            default:
                return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-300';
        }
    };

    if (loading && !stats) {
        return (
            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                        <span className="ml-3 text-gray-600 dark:text-gray-400">알림을 불러오는 중...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* 헤더 */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <AlertTriangle size={28} className="text-red-500" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">센서 알림 히스토리</h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    총 {totalCount}개의 알림 • 미해결 {unresolvedCount}개
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                loadAlerts();
                                loadStats();
                            }}
                            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                        >
                            <RefreshCw size={16} className="mr-2" />
                            새로고침
                        </button>
                    </div>
                </div>

                {/* 통계 대시보드 */}
                {stats && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <BarChart3 size={20} className="text-blue-500" />
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">알림 통계</h2>
                            </div>
                            <div className="flex space-x-2">
                                {['1d', '7d', '30d'].map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => handleStatsPeriodChange(period)}
                                        className={`px-3 py-1 rounded text-sm transition-colors duration-200 ${
                                            statsPeriod === period
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {period === '1d' ? '1일' : period === '7d' ? '7일' : '30일'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            {/* 전체 알림 */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">전체 알림</p>
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                            {stats?.total?.total_alerts || 0}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                        <Activity size={24} className="text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            {/* 미해결 알림 */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">미해결 알림</p>
                                        <p className="text-2xl font-bold text-orange-600">
                                            {stats?.total?.unresolved_alerts || 0}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                        <AlertTriangle size={24} className="text-orange-600" />
                                    </div>
                                </div>
                            </div>

                            {/* 심각한 알림 */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">심각한 알림</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {stats?.total?.critical_alerts || 0}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                                        <TrendingUp size={24} className="text-red-600" />
                                    </div>
                                </div>
                            </div>

                            {/* 해결률 */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">해결률</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {stats?.total?.total_alerts > 0 
                                                ? Math.round(((stats.total.total_alerts - stats.total.unresolved_alerts) / stats.total.total_alerts) * 100)
                                                : 0
                                            }%
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                        <CheckCircle size={24} className="text-green-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 센서별 통계 */}
                        {stats.by_sensor && Array.isArray(stats.by_sensor) && stats.by_sensor.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">센서별 알림 현황</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {stats.by_sensor.map((sensor, index) => (
                                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium text-gray-800 dark:text-white">
                                                    {sensor.sensor_name}
                                                </h4>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {sensor.sensor_type.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    총 {sensor.alert_count}개
                                                </span>
                                                <div className="flex space-x-2">
                                                    {sensor.unresolved_count > 0 && (
                                                        <span className="text-orange-600">
                                                            미해결 {sensor.unresolved_count}
                                                        </span>
                                                    )}
                                                    {sensor.critical_count > 0 && (
                                                        <span className="text-red-600">
                                                            심각 {sensor.critical_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 메시지 표시 */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${
                        message.includes('성공') || message.includes('해결')
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
                    }`}>
                        {message}
                    </div>
                )}

                {/* 필터 및 검색 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Filter size={20} className="text-gray-500" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">필터 및 검색</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* 검색 */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="센서명, 메시지 검색..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        {/* 심각도 필터 */}
                        <select
                            value={filters.severity}
                            onChange={(e) => handleFilterChange('severity', e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">모든 심각도</option>
                            <option value="low">낮음</option>
                            <option value="medium">보통</option>
                            <option value="high">높음</option>
                            <option value="critical">심각</option>
                        </select>

                        {/* 센서 타입 필터 */}
                        <select
                            value={filters.sensor_type}
                            onChange={(e) => handleFilterChange('sensor_type', e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">모든 센서</option>
                            <option value="mq4">메탄 가스</option>
                            <option value="mq136">황화수소 가스</option>
                            <option value="mq137">암모니아 가스</option>
                        </select>

                        {/* 해결 상태 필터 */}
                        <select
                            value={filters.resolved}
                            onChange={(e) => handleFilterChange('resolved', e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">모든 상태</option>
                            <option value="false">미해결</option>
                            <option value="true">해결됨</option>
                        </select>
                    </div>
                </div>

                {/* 일괄 작업 */}
                {Array.isArray(selectedAlerts) && selectedAlerts.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <span className="text-blue-800 dark:text-blue-300">
                                {selectedAlerts.length}개의 알림이 선택되었습니다.
                            </span>
                            <button
                                onClick={handleBulkResolve}
                                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                            >
                                <CheckCircle size={16} className="mr-2" />
                                선택된 알림 해결
                            </button>
                        </div>
                    </div>
                )}

                {/* 알림 목록 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">알림 목록</h2>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={handleSelectAll}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">전체 선택</span>
                            </label>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {!Array.isArray(alerts) || alerts.length === 0 ? (
                            <div className="p-8 text-center">
                                <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">표시할 알림이 없습니다.</p>
                            </div>
                        ) : (
                            alerts.map((alert) => (
                                <div key={alert?.id || Math.random()} className={`p-6 ${alert?.is_resolved ? 'opacity-60' : ''}`}>
                                    <div className="flex items-start space-x-4">
                                        {/* 체크박스 */}
                                        {!alert?.is_resolved && (
                                            <input
                                                type="checkbox"
                                                checked={Array.isArray(selectedAlerts) && selectedAlerts.includes(alert?.id)}
                                                onChange={() => handleSelectAlert(alert?.id)}
                                                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        )}

                                        {/* 심각도 표시 */}
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityClass(alert?.severity)}`}>
                                            {sensorAlertService.getSeverityEmoji(alert?.severity)} {(alert?.severity || '').toUpperCase()}
                                        </div>

                                        {/* 알림 내용 */}
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                                                    {alert?.sensor_name || '알 수 없는 센서'}
                                                </h3>
                                                <div className="flex items-center space-x-2">
                                                    {alert?.is_resolved ? (
                                                        <span className="flex items-center text-green-600 dark:text-green-400 text-sm">
                                                            <CheckCircle size={16} className="mr-1" />
                                                            해결됨
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleResolveAlert(alert?.id)}
                                                            className="flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors duration-200"
                                                        >
                                                            <CheckCircle size={14} className="mr-1" />
                                                            해결
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-gray-600 dark:text-gray-300 mb-2">
                                                {alert?.message || '메시지 없음'}
                                            </p>

                                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                                <span>
                                                    <strong>타입:</strong> {sensorAlertService.getAlertTypeDescription(alert?.alert_type)}
                                                </span>
                                                <span>
                                                    <strong>현재값:</strong> {alert?.current_value || 'N/A'}
                                                </span>
                                                {alert?.threshold_value && (
                                                    <span>
                                                        <strong>임계값:</strong> {alert.threshold_value}
                                                    </span>
                                                )}
                                                <span>
                                                    <Clock size={14} className="inline mr-1" />
                                                    {sensorAlertService.formatTime(alert?.created_at)}
                                                </span>
                                            </div>

                                            {alert?.resolved_at && (
                                                <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                                                    해결 시간: {new Date(alert.resolved_at).toLocaleString('ko-KR')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 페이지네이션 */}
                {totalCount > itemsPerPage && (
                    <div className="mt-6 flex justify-center">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                이전
                            </button>
                            <span className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                {currentPage} / {Math.ceil(totalCount / itemsPerPage)}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalCount / itemsPerPage)))}
                                disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                다음
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SensorAlertHistoryPage;