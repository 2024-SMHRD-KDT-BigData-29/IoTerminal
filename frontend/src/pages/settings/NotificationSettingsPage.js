// File: frontend/src/pages/settings/NotificationSettingsPage.js
import React, { useState, useEffect } from 'react';
import { Bell, Save, TestTube, Volume2, VolumeX, Clock, Mail, Smartphone } from 'lucide-react';
import notificationService from '../../services/notificationService';

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
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [testingNotification, setTestingNotification] = useState(false);

    // 컴포넌트 마운트 시 설정 로드
    useEffect(() => {
        loadSettings();
    }, []);

    // 설정 로드
    const loadSettings = async () => {
        try {
            setLoading(true);
            const userSettings = await notificationService.getSettings();
            setSettings(userSettings);
        } catch (error) {
            console.error('설정 로드 실패:', error);
            setMessage('설정을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 설정 변경 처리
    const handleSettingChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // 설정 저장
    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            await notificationService.updateSettings(settings);
            setMessage('설정이 성공적으로 저장되었습니다.');
            
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
            await notificationService.createTestNotification('welcome', {
                title: '테스트 알림',
                message: '알림 설정이 정상적으로 작동하고 있습니다!',
                type: 'success'
            });
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
                        이메일, 브라우저 알림, 앱 내 알림 등 다양한 알림 설정을 관리할 수 있습니다.
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

                <div className="space-y-8">
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettingsPage;