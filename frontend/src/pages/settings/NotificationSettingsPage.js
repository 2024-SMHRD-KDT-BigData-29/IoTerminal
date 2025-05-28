// File: frontend/src/pages/settings/NotificationSettingsPage.js
import React, { useState, useEffect } from 'react';
import { Bell, Save, TestTube, Volume2, VolumeX, Clock, Mail, Smartphone, AlertTriangle, Sliders, Plus, X, Trash2 } from 'lucide-react';
import notificationService from '../../services/notificationService';
import sensorAlertService from '../../services/sensorAlertService';
import SensorAddressInput from '../../components/common/SensorAddressInput';

const NotificationSettingsPage = () => {
    const [settings, setSettings] = useState({
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
    });

    // 센서 알림 설정
    const [sensorSettings, setSensorSettings] = useState({
        email_enabled: true,
        browser_enabled: true,
        sound_enabled: true,
        critical_only: false,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00'
    });

    const [thresholds, setThresholds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [testingNotification, setTestingNotification] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [showAddSensorModal, setShowAddSensorModal] = useState(false);
    const [newSensor, setNewSensor] = useState({
        sensor_type: '',
        sensor_name: '',
        unit: '',
        sensor_location: '',
        normal_min: 0,
        normal_max: 100,
        warning_min: 0,
        warning_max: 120,
        critical_min: 0,
        critical_max: 150,
        spike_threshold: 20
    });

    // 컴포넌트 마운트 시 설정 로드
    useEffect(() => {
        loadSettings();
    }, []);

    // 설정 로드
    const loadSettings = async () => {
        try {
            setLoading(true);
            const [generalSettings, sensorAlertSettings, thresholdData] = await Promise.all([
                notificationService.getSettings().catch(() => settings), // 기본값 사용
                sensorAlertService.getSettings().catch(() => sensorSettings), // 기본값 사용
                sensorAlertService.getThresholds().catch(() => []) // 빈 배열 사용
            ]);
            setSettings(generalSettings);
            setSensorSettings(sensorAlertSettings);
            setThresholds(thresholdData);
        } catch (error) {
            console.error('설정 로드 실패:', error);
            setMessage('설정을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 일반 설정 변경 처리
    const handleSettingChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // 센서 알림 설정 변경 처리
    const handleSensorSettingChange = (key, value) => {
        setSensorSettings(prev => ({
            ...prev,
            [key]: value
        }));
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

    // 설정 저장
    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            
            if (activeTab === 'general') {
                await notificationService.updateSettings(settings);
                setMessage('일반 알림 설정이 성공적으로 저장되었습니다.');
            } else if (activeTab === 'sensor') {
                await sensorAlertService.updateSettings(sensorSettings);
                setMessage('센서 알림 설정이 성공적으로 저장되었습니다.');
            } else if (activeTab === 'thresholds') {
                for (const threshold of thresholds) {
                    await sensorAlertService.updateThreshold(threshold.sensor_type, {
                        sensor_location: threshold.sensor_location,
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
                setMessage('센서 임계값 설정이 성공적으로 저장되었습니다.');
            }
            
            // 메시지 자동 제거
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('설정 저장 실패:', error);
            setMessage('설정 저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // 테스트 알림 전송
    const handleTestNotification = async () => {
        try {
            setTestingNotification(true);
            if (activeTab === 'general') {
                await notificationService.createTestNotification('welcome', {
                    title: '테스트 알림',
                    message: '일반 알림 설정이 정상적으로 작동하고 있습니다!',
                    type: 'success'
                });
            } else {
                await sensorAlertService.createTestAlert('mq4', 55.0);
            }
            setMessage('테스트 알림이 전송되었습니다.');
            
            // 메시지 자동 제거
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('테스트 알림 실패:', error);
            setMessage('테스트 알림 전송 중 오류가 발생했습니다.');
        } finally {
            setTestingNotification(false);
        }
    };

    // 새로운 센서 추가
    const handleAddSensor = async () => {
        try {
            setSaving(true);
            await sensorAlertService.createThreshold(newSensor);
            setMessage('새로운 센서가 성공적으로 추가되었습니다.');
            setShowAddSensorModal(false);
            setNewSensor({
                sensor_type: '',
                sensor_name: '',
                unit: '',
                sensor_location: '',
                normal_min: 0,
                normal_max: 100,
                warning_min: 0,
                warning_max: 120,
                critical_min: 0,
                critical_max: 150,
                spike_threshold: 20
            });
            await loadSettings();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('센서 추가 실패:', error);
            setMessage('센서 추가 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // 새 센서 입력값 변경
    const handleNewSensorChange = (field, value) => {
        setNewSensor(prev => ({
            ...prev,
            [field]: field.includes('_') && !field.includes('sensor') && !field.includes('unit') ? parseFloat(value) || 0 : value
        }));
    };

    // 센서 삭제
    const handleDeleteSensor = async (sensorType, sensorName) => {
        if (window.confirm(`정말로 "${sensorName}" 센서를 삭제하시겠습니까?`)) {
            try {
                setSaving(true);
                await sensorAlertService.deleteThreshold(sensorType);
                setMessage(`"${sensorName}" 센서가 성공적으로 삭제되었습니다.`);
                await loadSettings();
                setTimeout(() => setMessage(''), 3000);
            } catch (error) {
                console.error('센서 삭제 실패:', error);
                setMessage('센서 삭제 중 오류가 발생했습니다.');
            } finally {
                setSaving(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        <span className="ml-3 text-gray-600 dark:text-gray-400">설정을 불러오는 중...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                {/* 헤더 */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-4">
                        <Bell size={28} className="text-orange-500" />
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">알림 설정</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        이메일, 브라우저 알림, 센서 알림 등 다양한 알림 설정을 관리할 수 있습니다.
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
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                    activeTab === 'general'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <Bell size={16} />
                                    <span>일반 알림</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('sensor')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                    activeTab === 'sensor'
                                        ? 'border-red-500 text-red-600 dark:text-red-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <AlertTriangle size={16} />
                                    <span>센서 알림</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('thresholds')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                    activeTab === 'thresholds'
                                        ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <Sliders size={16} />
                                    <span>센서 임계값</span>
                                </div>
                            </button>
                        </nav>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* 일반 알림 설정 */}
                    {activeTab === 'general' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">일반 알림 설정</h2>
                            
                            <div className="space-y-6">
                                {/* 알림 방식 */}
                                <div>
                                    <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">알림 방식</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Mail size={20} className="text-blue-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">이메일 알림</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">중요한 알림을 이메일로 받습니다</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.email_enabled}
                                                    onChange={(e) => handleSettingChange('email_enabled', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Smartphone size={20} className="text-green-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">브라우저 알림</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">브라우저 푸시 알림을 받습니다</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.push_enabled}
                                                    onChange={(e) => handleSettingChange('push_enabled', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* 알림 유형 */}
                                <div>
                                    <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">알림 유형</h3>
                                    <div className="space-y-4">
                                        {[
                                            { key: 'sensor_alerts', label: '센서 알림', desc: '센서 이상치 감지 알림' },
                                            { key: 'device_alerts', label: '장치 알림', desc: '장치 상태 변경 알림' },
                                            { key: 'system_alerts', label: '시스템 알림', desc: '시스템 오류 및 업데이트 알림' },
                                            { key: 'workflow_alerts', label: '워크플로우 알림', desc: '작업 완료 및 진행 상황 알림' }
                                        ].map((item) => (
                                            <div key={item.key} className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings[item.key]}
                                                        onChange={(e) => handleSettingChange(item.key, e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 조용한 시간 */}
                                <div>
                                    <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">조용한 시간</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Clock size={20} className="text-purple-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">조용한 시간 활성화</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">지정된 시간에는 알림을 받지 않습니다</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.quiet_hours_enabled}
                                                    onChange={(e) => handleSettingChange('quiet_hours_enabled', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        {settings.quiet_hours_enabled && (
                                            <div className="grid grid-cols-2 gap-4 ml-8">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">시작 시간</label>
                                                    <input
                                                        type="time"
                                                        value={settings.quiet_hours_start}
                                                        onChange={(e) => handleSettingChange('quiet_hours_start', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">종료 시간</label>
                                                    <input
                                                        type="time"
                                                        value={settings.quiet_hours_end}
                                                        onChange={(e) => handleSettingChange('quiet_hours_end', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 센서 알림 설정 */}
                    {activeTab === 'sensor' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">센서 알림 설정</h2>
                            
                            <div className="space-y-6">
                                {/* 센서 알림 방식 */}
                                <div>
                                    <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">센서 알림 방식</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Mail size={20} className="text-blue-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">이메일 알림</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">센서 이상치 감지 알림을 이메일로 받습니다</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={sensorSettings.email_enabled}
                                                    onChange={(e) => handleSensorSettingChange('email_enabled', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Smartphone size={20} className="text-green-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">브라우저 알림</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">센서 이상치 감지 알림을 브라우저 푸시로 받습니다</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={sensorSettings.browser_enabled}
                                                    onChange={(e) => handleSensorSettingChange('browser_enabled', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Volume2 size={20} className="text-yellow-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">소리 알림</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">센서 이상치 감지 알림을 소리로 받습니다</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={sensorSettings.sound_enabled}
                                                    onChange={(e) => handleSensorSettingChange('sound_enabled', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* 센서 알림 유형 */}
                                <div>
                                    <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">센서 알림 유형</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">센서 이상치 감지 알림</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={sensorSettings.critical_only}
                                                    onChange={(e) => handleSensorSettingChange('critical_only', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* 조용한 시간 */}
                                <div>
                                    <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">조용한 시간</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Clock size={20} className="text-purple-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">조용한 시간 활성화</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">지정된 시간에는 알림을 받지 않습니다</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={sensorSettings.quiet_hours_enabled}
                                                    onChange={(e) => handleSensorSettingChange('quiet_hours_enabled', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        {sensorSettings.quiet_hours_enabled && (
                                            <div className="grid grid-cols-2 gap-4 ml-8">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">시작 시간</label>
                                                    <input
                                                        type="time"
                                                        value={sensorSettings.quiet_hours_start}
                                                        onChange={(e) => handleSensorSettingChange('quiet_hours_start', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">종료 시간</label>
                                                    <input
                                                        type="time"
                                                        value={sensorSettings.quiet_hours_end}
                                                        onChange={(e) => handleSensorSettingChange('quiet_hours_end', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 센서 임계값 설정 */}
                    {activeTab === 'thresholds' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">센서 임계값 설정</h2>
                                <button
                                    onClick={() => setShowAddSensorModal(true)}
                                    className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
                                >
                                    <Plus size={16} className="mr-2" />
                                    센서 추가
                                </button>
                            </div>
                            
                            <div className="space-y-6">
                                {thresholds.map((threshold) => (
                                    <div key={threshold.sensor_type} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                                        {/* 센서 헤더 */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-3 h-3 rounded-full ${threshold.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                                        {threshold.sensor_name || threshold.sensor_type}
                                                    </h3>
                                                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                                        <span>타입: {threshold.sensor_type}</span>
                                                        <span>•</span>
                                                        <span>단위: {threshold.unit}</span>
                                                        {threshold.sensor_location && (
                                                            <>
                                                                <span>•</span>
                                                                <span>위치: {threshold.sensor_location}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={threshold.enabled}
                                                        onChange={(e) => handleThresholdChange(threshold.sensor_type, 'enabled', e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                                </label>
                                                <button
                                                    onClick={() => handleDeleteSensor(threshold.sensor_type, threshold.sensor_name)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="센서 삭제"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* 센서 위치 입력 */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                센서 설치 위치
                                            </label>
                                            <SensorAddressInput
                                                value={threshold.sensor_location || ''}
                                                onAddressSelect={(address) => handleThresholdChange(threshold.sensor_type, 'sensor_location', address)}
                                                placeholder="예: 서울시 강남구 테헤란로 123 또는 1동 중앙부"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                정확한 주소를 입력하거나 "주소 검색" 버튼을 클릭하여 카카오 주소찾기를 이용하세요.
                                            </p>
                                        </div>

                                        {/* 임계값 설정 그리드 */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* 정상 범위 */}
                                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                                <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">정상 범위</h4>
                                                <div className="space-y-2">
                                                    <div>
                                                        <label className="block text-xs text-green-700 dark:text-green-400 mb-1">최소값</label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={threshold.normal_min}
                                                            onChange={(e) => handleThresholdChange(threshold.sensor_type, 'normal_min', e.target.value)}
                                                            className="w-full px-2 py-1 text-sm border border-green-300 dark:border-green-600 rounded focus:ring-2 focus:ring-green-500 dark:bg-green-900/30 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-green-700 dark:text-green-400 mb-1">최대값</label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={threshold.normal_max}
                                                            onChange={(e) => handleThresholdChange(threshold.sensor_type, 'normal_max', e.target.value)}
                                                            className="w-full px-2 py-1 text-sm border border-green-300 dark:border-green-600 rounded focus:ring-2 focus:ring-green-500 dark:bg-green-900/30 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 경고 범위 */}
                                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                                <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-3">경고 범위</h4>
                                                <div className="space-y-2">
                                                    <div>
                                                        <label className="block text-xs text-yellow-700 dark:text-yellow-400 mb-1">최소값</label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={threshold.warning_min}
                                                            onChange={(e) => handleThresholdChange(threshold.sensor_type, 'warning_min', e.target.value)}
                                                            className="w-full px-2 py-1 text-sm border border-yellow-300 dark:border-yellow-600 rounded focus:ring-2 focus:ring-yellow-500 dark:bg-yellow-900/30 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-yellow-700 dark:text-yellow-400 mb-1">최대값</label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={threshold.warning_max}
                                                            onChange={(e) => handleThresholdChange(threshold.sensor_type, 'warning_max', e.target.value)}
                                                            className="w-full px-2 py-1 text-sm border border-yellow-300 dark:border-yellow-600 rounded focus:ring-2 focus:ring-yellow-500 dark:bg-yellow-900/30 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 위험 범위 */}
                                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                                                <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-3">위험 범위</h4>
                                                <div className="space-y-2">
                                                    <div>
                                                        <label className="block text-xs text-red-700 dark:text-red-400 mb-1">최소값</label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={threshold.critical_min}
                                                            onChange={(e) => handleThresholdChange(threshold.sensor_type, 'critical_min', e.target.value)}
                                                            className="w-full px-2 py-1 text-sm border border-red-300 dark:border-red-600 rounded focus:ring-2 focus:ring-red-500 dark:bg-red-900/30 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-red-700 dark:text-red-400 mb-1">최대값</label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={threshold.critical_max}
                                                            onChange={(e) => handleThresholdChange(threshold.sensor_type, 'critical_max', e.target.value)}
                                                            className="w-full px-2 py-1 text-sm border border-red-300 dark:border-red-600 rounded focus:ring-2 focus:ring-red-500 dark:bg-red-900/30 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 급격한 변화 감지 */}
                                        <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                                            <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2">급격한 변화 감지</h4>
                                            <div className="flex items-center space-x-4">
                                                <label className="block text-xs text-purple-700 dark:text-purple-400">
                                                    변화량 임계값 ({threshold.unit})
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={threshold.spike_threshold}
                                                    onChange={(e) => handleThresholdChange(threshold.sensor_type, 'spike_threshold', e.target.value)}
                                                    className="w-24 px-2 py-1 text-sm border border-purple-300 dark:border-purple-600 rounded focus:ring-2 focus:ring-purple-500 dark:bg-purple-900/30 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {thresholds.length === 0 && (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>설정된 센서가 없습니다.</p>
                                        <p className="text-sm">우측 상단의 "센서 추가" 버튼을 클릭하여 센서를 추가해보세요.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 액션 버튼 */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200"
                            >
                                {saving ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                ) : (
                                    <Save size={20} className="mr-2" />
                                )}
                                {saving ? '저장 중...' : '설정 저장'}
                            </button>
                            
                            <button
                                onClick={handleTestNotification}
                                disabled={testingNotification}
                                className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors duration-200"
                            >
                                {testingNotification ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                ) : (
                                    <TestTube size={20} className="mr-2" />
                                )}
                                {testingNotification ? '전송 중...' : '테스트 알림'}
                            </button>

                            {activeTab === 'thresholds' && (
                                <button
                                    onClick={() => setShowAddSensorModal(true)}
                                    className="flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
                                >
                                    <Plus size={20} className="mr-2" />
                                    센서 추가
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 센서 추가 모달 */}
                {showAddSensorModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">새 센서 추가</h3>
                                <button
                                    onClick={() => setShowAddSensorModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">센서 타입</label>
                                    <input
                                        type="text"
                                        value={newSensor.sensor_type}
                                        onChange={(e) => handleNewSensorChange('sensor_type', e.target.value)}
                                        placeholder="예: mq4, mq136, temperature"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">센서 이름</label>
                                    <input
                                        type="text"
                                        value={newSensor.sensor_name}
                                        onChange={(e) => handleNewSensorChange('sensor_name', e.target.value)}
                                        placeholder="예: 메탄 가스 센서"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">단위</label>
                                    <input
                                        type="text"
                                        value={newSensor.unit}
                                        onChange={(e) => handleNewSensorChange('unit', e.target.value)}
                                        placeholder="예: ppm, °C, %"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">센서 설치 위치</label>
                                    <SensorAddressInput
                                        value={newSensor.sensor_location}
                                        onAddressSelect={(address) => handleNewSensorChange('sensor_location', address)}
                                        placeholder="예: 서울시 강남구 테헤란로 123 또는 1동 중앙부"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        정확한 주소를 입력하거나 "주소 검색" 버튼을 클릭하여 카카오 주소찾기를 이용하세요.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">정상 최소값</label>
                                        <input
                                            type="number"
                                            value={newSensor.normal_min}
                                            onChange={(e) => handleNewSensorChange('normal_min', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">정상 최대값</label>
                                        <input
                                            type="number"
                                            value={newSensor.normal_max}
                                            onChange={(e) => handleNewSensorChange('normal_max', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="flex space-x-4 pt-4">
                                    <button
                                        onClick={() => setShowAddSensorModal(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleAddSensor}
                                        disabled={!newSensor.sensor_type || !newSensor.sensor_name || saving}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                                    >
                                        {saving ? '추가 중...' : '추가'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationSettingsPage;