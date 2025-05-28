import React, { useState, useEffect } from 'react';
import { AlertTriangle, Save, TestTube, Volume2, VolumeX, Clock, Settings as SettingsIcon, Sliders } from 'lucide-react';
import sensorAlertService from '../services/sensorAlertService';

const SensorAlertSettingsPage = () => {
    const [thresholds, setThresholds] = useState([]);
    const [alertSettings, setAlertSettings] = useState({
        email_enabled: true,
        browser_enabled: true,
        sound_enabled: true,
        critical_only: false,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00'
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [testingAlert, setTestingAlert] = useState(false);
    const [activeTab, setActiveTab] = useState('thresholds');

    // 컴포넌트 마운트 시 설정 로드
    useEffect(() => {
        loadSettings();
    }, []);

    // 설정 로드
    const loadSettings = async () => {
        try {
            setLoading(true);
            const [thresholdData, settingsData] = await Promise.all([
                sensorAlertService.getThresholds(),
                sensorAlertService.getSettings()
            ]);
            setThresholds(thresholdData);
            setAlertSettings(settingsData);
        } catch (error) {
            console.error('설정 로드 실패:', error);
            setMessage('설정을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 임계값 변경 처리
    const handleThresholdChange = (sensorType, field, value) => {
        setThresholds(prev => 
            prev.map(threshold => 
                threshold.sensor_type === sensorType 
                    ? { ...threshold, [field]: parseFloat(value) || 0 }
                    : threshold
            )
        );
    };

    // 알림 설정 변경 처리
    const handleAlertSettingChange = (key, value) => {
        setAlertSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // 임계값 설정 저장
    const handleSaveThresholds = async () => {
        try {
            setSaving(true);
            for (const threshold of thresholds) {
                await sensorAlertService.updateThreshold(threshold.sensor_type, {
                    normal_min: threshold.normal_min,
                    normal_max: threshold.normal_max,
                    warning_min: threshold.warning_min,
                    warning_max: threshold.warning_max,
                    critical_min: threshold.critical_min,
                    critical_max: threshold.critical_max,
                    spike_threshold: threshold.spike_threshold,
                    enabled: threshold.enabled
                });
            }
            setMessage('임계값 설정이 성공적으로 저장되었습니다.');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('임계값 설정 저장 실패:', error);
            setMessage('임계값 설정 저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // 알림 설정 저장
    const handleSaveAlertSettings = async () => {
        try {
            setSaving(true);
            await sensorAlertService.updateSettings(alertSettings);
            setMessage('알림 설정이 성공적으로 저장되었습니다.');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('알림 설정 저장 실패:', error);
            setMessage('알림 설정 저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // 테스트 알림 전송
    const handleTestAlert = async (sensorType) => {
        try {
            setTestingAlert(true);
            await sensorAlertService.createTestAlert(sensorType, 55.0);
            setMessage(`${sensorAlertService.getSensorDisplayName(sensorType)} 테스트 알림이 전송되었습니다.`);
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('테스트 알림 실패:', error);
            setMessage('테스트 알림 전송 중 오류가 발생했습니다.');
        } finally {
            setTestingAlert(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                        <span className="ml-3 text-gray-600 dark:text-gray-400">설정을 불러오는 중...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-6xl mx-auto">
                {/* 헤더 */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-4">
                        <AlertTriangle size={28} className="text-red-500" />
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">센서 이상치 알림 설정</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        센서 임계값과 알림 설정을 관리하여 이상치 감지 시스템을 최적화할 수 있습니다.
                    </p>
                </div>

                {/* 메시지 표시 */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${
                        message.includes('성공') 
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
                    }`}>
                        {message}
                    </div>
                )}

                {/* 탭 네비게이션 */}
                <div className="mb-6">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('thresholds')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'thresholds'
                                        ? 'border-red-500 text-red-600 dark:text-red-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                            >
                                <Sliders size={16} className="inline mr-2" />
                                센서 임계값
                            </button>
                            <button
                                onClick={() => setActiveTab('alerts')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'alerts'
                                        ? 'border-red-500 text-red-600 dark:text-red-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                            >
                                <SettingsIcon size={16} className="inline mr-2" />
                                알림 설정
                            </button>
                        </nav>
                    </div>
                </div>

                {/* 센서 임계값 설정 탭 */}
                {activeTab === 'thresholds' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">센서 임계값 설정</h2>
                                <button
                                    onClick={handleSaveThresholds}
                                    disabled={saving}
                                    className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors duration-200"
                                >
                                    {saving ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    ) : (
                                        <Save size={16} className="mr-2" />
                                    )}
                                    {saving ? '저장 중...' : '임계값 저장'}
                                </button>
                            </div>

                            <div className="grid gap-6">
                                {thresholds.map((threshold) => (
                                    <div key={threshold.sensor_type} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                                                    {threshold.sensor_name}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    단위: {threshold.unit}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={threshold.enabled}
                                                        onChange={(e) => handleThresholdChange(threshold.sensor_type, 'enabled', e.target.checked)}
                                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">활성화</span>
                                                </label>
                                                <button
                                                    onClick={() => handleTestAlert(threshold.sensor_type)}
                                                    disabled={testingAlert}
                                                    className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded transition-colors duration-200"
                                                >
                                                    <TestTube size={14} className="mr-1" />
                                                    테스트
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    정상 최소값
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={threshold.normal_min}
                                                    onChange={(e) => handleThresholdChange(threshold.sensor_type, 'normal_min', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    정상 최대값
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={threshold.normal_max}
                                                    onChange={(e) => handleThresholdChange(threshold.sensor_type, 'normal_max', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                                                    경고 최소값
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={threshold.warning_min}
                                                    onChange={(e) => handleThresholdChange(threshold.sensor_type, 'warning_min', e.target.value)}
                                                    className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-600 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                                                    경고 최대값
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={threshold.warning_max}
                                                    onChange={(e) => handleThresholdChange(threshold.sensor_type, 'warning_max', e.target.value)}
                                                    className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-600 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                                                    위험 최소값
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={threshold.critical_min}
                                                    onChange={(e) => handleThresholdChange(threshold.sensor_type, 'critical_min', e.target.value)}
                                                    className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                                                    위험 최대값
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={threshold.critical_max}
                                                    onChange={(e) => handleThresholdChange(threshold.sensor_type, 'critical_max', e.target.value)}
                                                    className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                                                    급격한 변화 임계값
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={threshold.spike_threshold}
                                                    onChange={(e) => handleThresholdChange(threshold.sensor_type, 'spike_threshold', e.target.value)}
                                                    className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 알림 설정 탭 */}
                {activeTab === 'alerts' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">알림 설정</h2>
                                <button
                                    onClick={handleSaveAlertSettings}
                                    disabled={saving}
                                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200"
                                >
                                    {saving ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    ) : (
                                        <Save size={16} className="mr-2" />
                                    )}
                                    {saving ? '저장 중...' : '설정 저장'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 알림 방식 설정 */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-800 dark:text-white">알림 방식</h3>
                                    
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={alertSettings.browser_enabled}
                                            onChange={(e) => handleAlertSettingChange('browser_enabled', e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-3 text-gray-700 dark:text-gray-300">브라우저 알림</span>
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={alertSettings.sound_enabled}
                                            onChange={(e) => handleAlertSettingChange('sound_enabled', e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-3 text-gray-700 dark:text-gray-300">알림 소리</span>
                                        {alertSettings.sound_enabled ? (
                                            <Volume2 size={16} className="ml-2 text-green-500" />
                                        ) : (
                                            <VolumeX size={16} className="ml-2 text-gray-400" />
                                        )}
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={alertSettings.critical_only}
                                            onChange={(e) => handleAlertSettingChange('critical_only', e.target.checked)}
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        />
                                        <span className="ml-3 text-gray-700 dark:text-gray-300">심각한 알림만 표시</span>
                                    </label>
                                </div>

                                {/* 조용한 시간 설정 */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-800 dark:text-white">조용한 시간</h3>
                                    
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={alertSettings.quiet_hours_enabled}
                                            onChange={(e) => handleAlertSettingChange('quiet_hours_enabled', e.target.checked)}
                                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="ml-3 text-gray-700 dark:text-gray-300">조용한 시간 활성화</span>
                                        <Clock size={16} className="ml-2 text-purple-500" />
                                    </label>

                                    {alertSettings.quiet_hours_enabled && (
                                        <div className="ml-6 space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    시작 시간
                                                </label>
                                                <input
                                                    type="time"
                                                    value={alertSettings.quiet_hours_start}
                                                    onChange={(e) => handleAlertSettingChange('quiet_hours_start', e.target.value)}
                                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    종료 시간
                                                </label>
                                                <input
                                                    type="time"
                                                    value={alertSettings.quiet_hours_end}
                                                    onChange={(e) => handleAlertSettingChange('quiet_hours_end', e.target.value)}
                                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SensorAlertSettingsPage; 