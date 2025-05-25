import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, User, ChevronDown, Moon, Sun, Activity, Box, BarChart, Settings } from 'lucide-react';
import { getCurrentUserData, logout } from '../services/authService';
import io from 'socket.io-client';
import Sidebar from './Sidebar';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

const MainLayout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const [isConnected, setIsConnected] = useState(false);
    const [currentLocation, setCurrentLocation] = useState('위치 확인 중...');

    const navigate = useNavigate();
    const location = useLocation();
    const profileDropdownRef = useRef(null);

    const menuItemsData = [
        { path: '/dashboard', icon: <Activity size={20} />, text: '대시보드' },
        { path: '/workflow', icon: <Box size={20} />, text: '워크플로우' },
        {
            path: '/iot/devices',
            icon: <BarChart size={20} />,
            text: 'IoT 디바이스',
            submenu: [
                { path: '/iot/devices/management', text: '디바이스 관리' },
                { path: '/iot/devices/analysis', text: '데이터 분석' }
            ]
        },
        { path: '/settings', icon: <Settings size={20} />, text: '설정' },
    ];

    // 디버깅: menuItemsData 확인
    console.log('menuItemsData:', menuItemsData);

    const getPageTitle = () => {
        for (const item of menuItemsData) {
            if (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'))) {
                return item.text;
            }
            if (item.submenu) {
                for (const subItem of item.submenu) {
                    if (location.pathname === subItem.path || (subItem.path !== '/' && location.pathname.startsWith(subItem.path + '/'))) {
                        return subItem.text;
                    }
                }
            }
        }
        return 'IoTerminal';
    };

    const currentUser = getCurrentUserData() || { name: 'Guest', email: 'guest@example.com' };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle('dark');
        setIsDarkMode(!isDarkMode);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [profileDropdownRef]);

    const isActivePath = (itemPath, currentPath) => {
        if (itemPath === currentPath) return true;
        if (itemPath !== '/' && currentPath.startsWith(itemPath)) return true;
        return false;
    };

    useEffect(() => {
        const socket = io(SOCKET_SERVER_URL, { transports: ['websocket'] });
        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));
        socket.on('connect_error', () => setIsConnected(false));
        return () => socket.disconnect();
    }, []);

    // File: frontend/src/layouts/MainLayout.js (현재 위치 가져오는 useEffect 부분)
    useEffect(() => {
        if (!navigator.geolocation) {
            setCurrentLocation('위치 정보 사용 불가');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                console.log("[MainLayout Geolocation] 위도:", latitude, "경도:", longitude);

                if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
                    console.error("[MainLayout Geolocation] 유효하지 않은 좌표값 수신:", { latitude, longitude });
                    setCurrentLocation('유효하지 않은 좌표');
                    return;
                }

                try {
                    const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=ko`;
                    console.log("[MainLayout Geolocation] Nominatim API 요청 URL:", apiUrl);
                    
                    const res = await fetch(apiUrl, {
                        method: 'GET', // 명시적으로 GET 명시 (기본값이지만)
                        headers: {
                            'Accept': 'application/json' // 어떤 타입의 응답을 받을지 명시
                        }
                    });

                    console.log("[MainLayout Geolocation] Nominatim API 응답 상태:", res.status, res.statusText);

                    if (!res.ok) { // 400 포함 모든 에러 상태 체크
                        // 오류 응답 본문을 텍스트로 읽어보거나, JSON으로 시도
                        let errorBodyText = await res.text(); // 서버가 보낸 오류 메시지 확인 시도
                        console.error("[MainLayout Geolocation] Nominatim API 오류 응답:", errorBodyText);
                        throw new Error(`Nominatim API 요청 실패: ${res.status} ${res.statusText}. 서버 응답: ${errorBodyText.substring(0,100)}...`);
                    }
                    
                    const data = await res.json();
                    console.log("[MainLayout Geolocation] Nominatim API 응답 데이터:", data);
                    
                    setCurrentLocation(data.display_name || '주소 정보 없음');

                } catch (error) {
                    console.error("[MainLayout Geolocation] 주소 변환 중 오류:", error);
                    setCurrentLocation('주소 변환 실패');
                }
            },
            (error) => {
                console.error("[MainLayout Geolocation] 위치 정보 가져오기 오류:", error.code, error.message);
                let errorMessage = '위치 권한 필요 또는 오류';
                if (error.code === 1) errorMessage = '위치 정보 접근 권한이 거부되었습니다.';
                else if (error.code === 2) errorMessage = '위치 정보를 사용할 수 없습니다 (예: 네트워크 오류).';
                else if (error.code === 3) errorMessage = '위치 정보를 가져오는 데 시간이 너무 오래 걸립니다.';
                setCurrentLocation(errorMessage);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, []); // 컴포넌트 마운트 시 한 번만 실행

    return (
        <div className="flex flex-col min-h-screen bg-[var(--content-bg)] dark:bg-[var(--content-dark-bg)] transition-colors duration-300">
            <div className="flex flex-1">
                {/* 사이드바 */}
                <Sidebar
                    sidebarCollapsed={sidebarCollapsed}
                    setSidebarCollapsed={setSidebarCollapsed}
                    menuItemsData={menuItemsData}
                    isActivePath={isActivePath}
                    currentPath={location.pathname}
                    isConnected={isConnected}
                    currentLocation={currentLocation}
                />

                {/* 메인 콘텐츠 */}
                <div className="flex-1 flex flex-col">
                    <header className="bg-white dark:bg-[#2f263d] shadow-md h-16 flex items-center justify-between px-6 z-10">
                        <h1 className="text-xl font-semibold text-[#3a2e5a] dark:text-[#b39ddb]">{getPageTitle()}</h1>
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#3a2e5a]" title="검색">
                                <Search size={20} className="text-gray-600 dark:text-[#b39ddb]" />
                            </button>
                            <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#3a2e5a]" title="알림">
                                <Bell size={20} className="text-gray-600 dark:text-[#b39ddb]" />
                            </button>
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#3a2e5a]"
                                title={isDarkMode ? '라이트 모드' : '다크 모드'}
                            >
                                {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-600" />}
                            </button>
                            <div className="relative" ref={profileDropdownRef}>
                                <button
                                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                    className="flex items-center p-1 rounded-full hover:bg-gray-200 dark:hover:bg-[#3a2e5a] focus:outline-none"
                                    title="사용자 메뉴"
                                >
                                    <div className="h-8 w-8 rounded-full bg-violet-200 dark:bg-[#9575cd] flex items-center justify-center text-violet-700 dark:text-violet-100">
                                        {currentUser.profileImageUrl ? (
                                            <img src={currentUser.profileImageUrl} alt="profile" className="h-8 w-8 rounded-full object-cover" />
                                        ) : (
                                            <User size={20} />
                                        )}
                                    </div>
                                    <span className="hidden sm:inline ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">{currentUser.name}</span>
                                    <ChevronDown size={16} className="hidden sm:inline ml-1 text-gray-600 dark:text-gray-400" />
                                </button>
                                {profileDropdownOpen && (
                                    <div 
                                        className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-[#3a2e5a] rounded-xl shadow-lg z-50 ring-1 ring-black ring-opacity-5 focus:outline-none"
                                    >
                                        <div className="py-1">
                                            <div className="px-4 py-3">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentUser.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
                                            </div>
                                            <hr className="border-gray-200 dark:border-[#4a3f6d]"/>
                                            <Link
                                                to="/settings"
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#4a3f6d]"
                                                onClick={() => setProfileDropdownOpen(false)}
                                            >
                                                계정 정보
                                            </Link>
                                            <Link
                                                to="/help"
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#4a3f6d]"
                                                onClick={() => setProfileDropdownOpen(false)}
                                            >
                                                도움말
                                            </Link>
                                            <hr className="border-gray-200 dark:border-[#4a3f6d]"/>
                                            <button
                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[#4a3f6d]"
                                                onClick={() => {
                                                    setProfileDropdownOpen(false);
                                                    handleLogout();
                                                }}
                                            >
                                                로그아웃
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto bg-[var(--content-bg)] dark:bg-[var(--content-dark-bg)] p-4 sm:p-6 transition-colors duration-300">
                        <div className="max-w-full mx-auto">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default MainLayout;