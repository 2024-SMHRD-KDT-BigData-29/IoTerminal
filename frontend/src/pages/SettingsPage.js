// File: frontend/src/pages/SettingsPage.js
import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { getCurrentUserData } from '../services/authService';

const defaultSettings = {
    emailNotification: true,
    sensorAlert: true,
    snsAlert: true,
    dndStart: '22:00',
    dndEnd: '07:00',
};
const defaultAccount = {
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
};
const LOCAL_KEY = 'ioterminal_notification_settings';
const ACCOUNT_KEY = 'ioterminal_account_settings';

const SettingsPage = () => {
    const [tab, setTab] = useState('notification');
    const [settings, setSettings] = useState(defaultSettings);
    const [saved, setSaved] = useState(false);
    const [account, setAccount] = useState(defaultAccount);
    const [accountSaved, setAccountSaved] = useState(false);
    const [accountError, setAccountError] = useState('');
    const [passwordMatchError, setPasswordMatchError] = useState('');

    useEffect(() => {
        const savedSettings = localStorage.getItem(LOCAL_KEY);
        if (savedSettings) setSettings(JSON.parse(savedSettings));
        
        // 로그인된 사용자 정보 가져오기
        const currentUser = getCurrentUserData();
        if (currentUser) {
            setAccount(prev => ({
                ...prev,
                name: currentUser.name || '',
                email: currentUser.email || '',
                phone: currentUser.phone || ''
            }));
        }
    }, []);

    // 알림 설정 핸들러
    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
        setSaved(false);
    };
    const handleTimeChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };
    const handleSave = () => {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
        setSaved(true);
    };

    // 계정 설정 핸들러
    const handleAccountChange = (key, value) => {
        setAccount(prev => ({ ...prev, [key]: value }));
        setAccountSaved(false);
        setAccountError('');
        if (key === 'newPassword' || key === 'confirmPassword') {
            const newPassword = key === 'newPassword' ? value : account.newPassword;
            const confirmPassword = key === 'confirmPassword' ? value : account.confirmPassword;
            if (newPassword && confirmPassword && newPassword !== confirmPassword) {
                setPasswordMatchError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
            } else {
                setPasswordMatchError('');
            }
        }
    };
    const handleAccountSave = () => {
        // 비밀번호 변경 유효성 검사
        if (account.newPassword && account.newPassword !== account.confirmPassword) {
            setAccountError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
            return;
        }
        // 실제 서비스라면 여기서 API 호출
        localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
        setAccountSaved(true);
        setAccountError('');
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
                <Settings size={32} className="text-gray-600" />
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-[#b39ddb] mb-0">설정</h2>
            </div>
            {/* 탭 메뉴 */}
            <div className="flex gap-2 mb-6">
                <button
                    className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-colors duration-200 ${tab === 'notification' ? 'border-[#7e57c2] text-[#7e57c2] dark:text-[#b39ddb]' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
                    onClick={() => setTab('notification')}
                >
                    알림설정
                </button>
                <button
                    className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-colors duration-200 ${tab === 'account' ? 'border-[#7e57c2] text-[#7e57c2] dark:text-[#b39ddb]' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
                    onClick={() => setTab('account')}
                >
                    계정설정
                </button>
            </div>
            {/* 탭별 내용 */}
            {tab === 'notification' && (
                <div className="bg-white dark:bg-[#3a2e5a] p-8 rounded-xl shadow-lg max-w-xl mx-auto">
                    <h3 className="text-xl font-bold text-[#7e57c2] dark:text-[#b39ddb] mb-4">알림 설정</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-[#3a2e5a] dark:text-[#b39ddb]">이메일 알림 수신</div>
                                <div className="text-xs text-gray-500 dark:text-gray-300">중요 이벤트 발생 시 이메일로 알림을 받습니다.</div>
                            </div>
                            <button
                                onClick={() => handleToggle('emailNotification')}
                                className={`w-12 h-7 flex items-center rounded-full p-1 duration-300 focus:outline-none ${settings.emailNotification ? 'bg-[#7e57c2]' : 'bg-gray-300'}`}
                            >
                                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ${settings.emailNotification ? 'translate-x-5' : ''}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-[#3a2e5a] dark:text-[#b39ddb]">센서 데이터 경고 알림</div>
                                <div className="text-xs text-gray-500 dark:text-gray-300">센서 임계값 초과 등 경고 발생 시 알림을 받습니다.</div>
                            </div>
                            <button
                                onClick={() => handleToggle('sensorAlert')}
                                className={`w-12 h-7 flex items-center rounded-full p-1 duration-300 focus:outline-none ${settings.sensorAlert ? 'bg-[#7e57c2]' : 'bg-gray-300'}`}
                            >
                                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ${settings.sensorAlert ? 'translate-x-5' : ''}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-[#3a2e5a] dark:text-[#b39ddb]">SNS 알림 설정</div>
                                <div className="text-xs text-gray-500 dark:text-gray-300">카카오톡, 문자 등 SNS로 알림을 받을 수 있습니다.</div>
                            </div>
                            <button
                                onClick={() => handleToggle('snsAlert')}
                                className={`w-12 h-7 flex items-center rounded-full p-1 duration-300 focus:outline-none ${settings.snsAlert ? 'bg-[#7e57c2]' : 'bg-gray-300'}`}
                            >
                                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ${settings.snsAlert ? 'translate-x-5' : ''}`}></div>
                            </button>
                        </div>
                        <div>
                            <div className="font-medium text-[#3a2e5a] dark:text-[#b39ddb] mb-1">방해 금지 시간</div>
                            <div className="text-xs text-gray-500 dark:text-gray-300 mb-2">설정한 시간에는 알림이 전송되지 않습니다.</div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="time"
                                    value={settings.dndStart}
                                    onChange={e => handleTimeChange('dndStart', e.target.value)}
                                    className="px-2 py-1 rounded-md border border-[#b39ddb] bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb]"
                                />
                                <span className="mx-1 text-[#7e57c2] dark:text-[#b39ddb]">~</span>
                                <input
                                    type="time"
                                    value={settings.dndEnd}
                                    onChange={e => handleTimeChange('dndEnd', e.target.value)}
                                    className="px-2 py-1 rounded-md border border-[#b39ddb] bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb]"
                                />
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        className="mt-8 w-full py-3 rounded-xl bg-[#7e57c2] dark:bg-[#9575cd] text-white font-semibold text-lg shadow hover:bg-[#5e35b1] dark:hover:bg-[#b39ddb] transition-colors duration-200"
                    >
                        저장
                    </button>
                    {saved && <div className="mt-3 text-green-600 dark:text-green-400 text-center text-sm">설정이 저장되었습니다.</div>}
                </div>
            )}
            {tab === 'account' && (
                <div className="bg-white dark:bg-[#3a2e5a] p-8 rounded-xl shadow-lg max-w-xl mx-auto">
                    <h3 className="text-xl font-bold text-[#7e57c2] dark:text-[#b39ddb] mb-4">계정 관리</h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-[#7e57c2] mb-1">이름</label>
                            <input
                                type="text"
                                value={account.name}
                                onChange={e => handleAccountChange('name', e.target.value)}
                                className="w-full px-3 py-2 border border-[#b39ddb] rounded-md bg-gray-100 dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#7e57c2] mb-1">이메일</label>
                            <input
                                type="email"
                                value={account.email}
                                readOnly
                                className="w-full px-3 py-2 border border-[#b39ddb] rounded-md bg-gray-100 dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb] opacity-70 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#7e57c2] mb-1">휴대폰 번호</label>
                            <input
                                type="text"
                                value={account.phone}
                                onChange={e => handleAccountChange('phone', e.target.value)}
                                className="w-full px-3 py-2 border border-[#b39ddb] rounded-md bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb]"
                                placeholder="예: 010-1234-5678"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#7e57c2] mb-1">주소</label>
                            <input
                                type="text"
                                value={account.address}
                                onChange={e => handleAccountChange('address', e.target.value)}
                                className="w-full px-3 py-2 border border-[#b39ddb] rounded-md bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb]"
                                placeholder="주소를 입력하세요"
                                autoComplete="off"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#7e57c2] mb-1">수정할 비밀번호</label>
                            <input
                                type="password"
                                value={account.newPassword}
                                onChange={e => handleAccountChange('newPassword', e.target.value)}
                                className="w-full px-3 py-2 border border-[#b39ddb] rounded-md bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb]"
                                autoComplete="new-password"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#7e57c2] mb-1">수정할 비밀번호 확인</label>
                            <input
                                type="password"
                                value={account.confirmPassword}
                                onChange={e => handleAccountChange('confirmPassword', e.target.value)}
                                className="w-full px-3 py-2 border border-[#b39ddb] rounded-md bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb]"
                                autoComplete="new-password"
                            />
                            {passwordMatchError && <div className="mt-1 text-red-500 text-sm">{passwordMatchError}</div>}
                        </div>
                    </div>
                    <button
                        onClick={handleAccountSave}
                        className="mt-8 w-full py-3 rounded-xl bg-[#7e57c2] dark:bg-[#9575cd] text-white font-semibold text-lg shadow hover:bg-[#5e35b1] dark:hover:bg-[#b39ddb] transition-colors duration-200"
                    >
                        수정
                    </button>
                    {accountSaved && <div className="mt-3 text-green-600 dark:text-green-400 text-center text-sm">계정 정보가 수정되었습니다.</div>}
                    {accountError && <div className="mt-3 text-red-600 dark:text-red-400 text-center text-sm">{accountError}</div>}
                </div>
            )}
        </div>
    );
};

export default SettingsPage;