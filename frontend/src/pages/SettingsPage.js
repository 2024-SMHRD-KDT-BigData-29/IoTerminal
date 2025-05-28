// File: frontend/src/pages/SettingsPage.js
import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { getCurrentUserData, updateUserInfo } from '../services/authService';
import AddressSearchInput from '../components/common/AddressSearchInput';

const defaultAccount = {
    name: '',
    email: '',
    phone: '',
    address: '',
    addressDetail: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
};
const ACCOUNT_KEY = 'ioterminal_account_settings';

const SettingsPage = () => {
    const [account, setAccount] = useState(defaultAccount);
    const [accountSaved, setAccountSaved] = useState(false);
    const [accountError, setAccountError] = useState('');
    const [passwordMatchError, setPasswordMatchError] = useState('');

    useEffect(() => {
        // 로그인된 사용자 정보 가져오기
        const currentUser = getCurrentUserData();
        if (currentUser) {
            let address = '';
            let addressDetail = '';
            if (currentUser.address) {
                // address = '카카오주소 상세주소' 형태로 저장되어 있으므로, 마지막 공백 기준으로 분리
                const arr = currentUser.address.trim().split(' ');
                if (arr.length > 1) {
                    addressDetail = arr.pop();
                    address = arr.join(' ');
                } else {
                    address = currentUser.address;
                }
            }
            setAccount(prev => ({
                ...prev,
                name: currentUser.name || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                address,
                addressDetail
            }));
        }
    }, []);

    // 계정 설정 핸들러
    const handleAccountChange = (e) => {
        const { name, value } = e.target;
        setAccount(prev => ({
            ...prev,
            [name]: value
        }));

        // 비밀번호 일치 여부 확인
        if (name === 'newPassword' || name === 'confirmPassword') {
            if (name === 'newPassword') {
                setPasswordMatchError(
                    value !== account.confirmPassword ? '비밀번호가 일치하지 않습니다.' : ''
                );
            } else {
                setPasswordMatchError(
                    value !== account.newPassword ? '비밀번호가 일치하지 않습니다.' : ''
                );
            }
        }
    };
    
    const handleAccountSave = async () => {
        try {
            setAccountError('');
            if (account.newPassword && account.newPassword !== account.confirmPassword) {
                setAccountError('비밀번호가 일치하지 않습니다.');
                return;
            }

            const userData = {
                name: account.name,
                email: account.email,
                phone: account.phone,
                address: account.address + (account.addressDetail ? ` ${account.addressDetail}` : ''),
                newPassword: account.newPassword
            };

            await updateUserInfo(userData);
            setAccountSaved(true);
            setTimeout(() => setAccountSaved(false), 3000);
        } catch (error) {
            console.error('계정 정보 수정 오류:', error);
            setAccountError(error.response?.data?.message || '계정 정보 수정 중 오류가 발생했습니다.');
        }
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
                <Settings size={32} className="text-gray-600" />
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-[#b39ddb] mb-0">계정 설정</h2>
            </div>

            <div className="bg-white dark:bg-[#3a2e5a] p-8 rounded-xl shadow-lg max-w-xl mx-auto">
                <h3 className="text-xl font-bold text-[#7e57c2] dark:text-[#b39ddb] mb-4">계정 관리</h3>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[#7e57c2] mb-1">이름</label>
                        <input
                            type="text"
                            name="name"
                            value={account.name}
                            onChange={handleAccountChange}
                            className="w-full px-3 py-2 border border-[#b39ddb] rounded-md bg-gray-100 dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#7e57c2] mb-1">이메일</label>
                        <input
                            type="email"
                            name="email"
                            value={account.email}
                            onChange={handleAccountChange}
                            className="w-full px-3 py-2 border border-[#b39ddb] rounded-md bg-gray-100 dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#7e57c2] mb-1">휴대폰 번호</label>
                        <input
                            type="tel"
                            name="phone"
                            value={account.phone}
                            onChange={handleAccountChange}
                            className="w-full px-3 py-2 border border-[#b39ddb] rounded-md bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb]"
                            placeholder="예: 010-1234-5678"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#7e57c2] mb-1">주소</label>
                        <AddressSearchInput
                            value={account.address}
                            onAddressSelect={(address) => handleAccountChange({ target: { name: 'address', value: address } })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#7e57c2] mb-1 mt-2">상세주소</label>
                        <input
                            type="text"
                            name="addressDetail"
                            value={account.addressDetail}
                            onChange={handleAccountChange}
                            className="w-full px-3 py-2 border border-[#b39ddb] rounded-md bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb] placeholder-[#b39ddb] focus:ring-2 focus:ring-[#7e57c2] focus:border-[#7e57c2] transition"
                            placeholder="상세주소를 입력하세요 (예: 101동 202호)"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#7e57c2] mb-1">수정할 비밀번호</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={account.newPassword}
                            onChange={handleAccountChange}
                            className="w-full px-3 py-2 border border-[#b39ddb] rounded-md bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb]"
                            autoComplete="new-password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#7e57c2] mb-1">수정할 비밀번호 확인</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={account.confirmPassword}
                            onChange={handleAccountChange}
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
        </div>
    );
};

export default SettingsPage;