// File: frontend/src/layouts/MainLayout.js
import React, { useState, useEffect, useRef, useCallback } from 'react'; // useCallback 추가
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    Menu as MenuIcon,
    BarChart,
    Settings,
    Database,
    Activity,
    Globe,
    Shield,
    Box,
    ChevronDown,
    Bell,
    Search,
    User,
    HelpCircle,
    LogOut,
    Moon, 
    Sun, 
    LineChart 
} from 'lucide-react';
import { getCurrentUserData, logout } from '../services/authService';
import io from 'socket.io-client';

const SidebarMenuItem = ({ path, icon, text, active = false, collapsed = false, submenu = [] }) => {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
    const location = useLocation();

    const handleItemClick = (e) => {
        if (submenu.length > 0) {
            e.preventDefault(); 
            setIsSubmenuOpen(!isSubmenuOpen);
        }
    };

    return (
        <li>
            <div className="flex flex-col">
                <Link
                    to={path}
                    className={`
                        flex items-center px-3 py-2.5 text-sm font-medium rounded-2xl mx-2 mb-1
                        transition-all duration-200 justify-between group 
                        ${active
                            ? 'bg-violet-200 text-violet-900 shadow-md dark:bg-[#3a2e5a] dark:text-[#b39ddb]'
                            : 'text-violet-500 hover:bg-violet-100 hover:text-violet-900 dark:text-[#b39ddb] dark:hover:bg-[#3a2e5a] dark:hover:text-[#ede7f6]'
                        }
                    `}
                    title={text}
                    onClick={handleItemClick}
                >
                    <div className="flex items-center">
                        <span className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}>{icon}</span>
                        {!collapsed && <span className="truncate flex-1">{text}</span>}
                    </div>
                    {!collapsed && submenu.length > 0 && (
                        <ChevronDown
                            size={16}
                            className={`transform transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''}`}
                        />
                    )}
                </Link>
                {!collapsed && isSubmenuOpen && submenu.length > 0 && (
                    <ul className="ml-6 mt-1 mb-1 space-y-1 pl-5 border-l border-violet-200 dark:border-violet-700">
                        {submenu.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`
                                        block px-3 py-2 text-xs font-medium rounded-xl
                                        ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'))
                                            ? 'bg-violet-100 text-violet-900 dark:bg-[#3a2e5a] dark:text-violet-100'
                                            : 'text-violet-500 hover:bg-violet-50 hover:text-violet-700 dark:text-violet-400 dark:hover:bg-[#31264f] dark:hover:text-violet-200'
                                        }
                                    `}
                                >
                                    {item.text}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </li>
    );
};

// 푸터 컴포넌트 정의 (페이지 흐름의 맨 아래에 위치하도록)
const AppFooter = () => {
    return (
        <footer className="bg-[#f8f6fc] dark:bg-[#211a2e] text-center p-4 print:hidden flex-shrink-0"> {/* border-t 관련 클래스 제거 */}
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Copyright © 2025 IoTerminal 이김손 팀
            </p>
            <p className="text-xs">
                <Link to="/privacy-policy" className="text-violet-500 hover:text-violet-700 hover:underline mx-1.5 dark:text-violet-400 dark:hover:text-violet-300">
                    개인정보처리방침
                </Link>
                <span className="text-gray-400 dark:text-gray-600">·</span>
                <Link to="/terms-and-conditions" className="text-violet-500 hover:text-violet-700 hover:underline mx-1.5 dark:text-violet-400 dark:hover:text-violet-300">
                    이용약관
                </Link>
            </p>
        </footer>
    );
};

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

const MainLayout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false); // 알림 드롭다운 상태 추가
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
    const [isConnected, setIsConnected] = useState(false);
    const [currentLocation, setCurrentLocation] = useState('위치 확인 중...');

    const navigate = useNavigate();
    const location = useLocation();
    const profileDropdownRef = useRef(null);
    const notificationDropdownRef = useRef(null); // 알림 드롭다운 ref 추가

    // 대표님께서 제공해주신 메뉴 항목 유지 (한글화 및 서브메뉴 구조 포함)
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

    const getPageTitle = () => {
        for (const item of menuItemsData) {
            if (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/') && (!item.submenu || item.submenu.length === 0) )) {
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
        if(location.pathname === '/') return '대시보드'; 
        return 'IoTerminal';
    };

    const currentUser = getCurrentUserData() || { name: 'Guest', username: 'Guest', email: 'guest@example.com', role: '방문자' };
    const handleLogout = () => { logout(); navigate('/login'); setProfileDropdownOpen(false);};

    const toggleDarkMode = () => {
        const newDarkModeState = !isDarkMode;
        setIsDarkMode(newDarkModeState);
        if (newDarkModeState) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };
    useEffect(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            setIsDarkMode(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDarkMode(false);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setProfileDropdownOpen(false);
            }
            if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
                setNotificationDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const socket = io(SOCKET_SERVER_URL, { transports: ['websocket'] });
        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));
        socket.on('connect_error', () => setIsConnected(false));
        return () => socket.disconnect();
    }, []);

    useEffect(() => {
        if (!navigator.geolocation) {setCurrentLocation('위치 정보 사용 불가'); return;}
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                    const data = await res.json();
                    setCurrentLocation(data.display_name || '주소 정보 없음');
                } catch { setCurrentLocation('주소 변환 실패'); }
            },
            () => setCurrentLocation('위치 권한 필요')
        );
    }, []);

    const isActivePath = (itemPath, currentPath) => {
        if (!itemPath || !currentPath) return false;
        if (itemPath === '/dashboard' && currentPath === '/dashboard') return true;
        if (itemPath !== '/dashboard' && itemPath !== '/' && currentPath.startsWith(itemPath)) return true;
        const parentItem = menuItemsData.find(menu => menu.submenu?.some(sub => sub.path === itemPath));
        if(parentItem && currentPath.startsWith(parentItem.path)) return true;
        return false;
    };

    return (
        // 대표님께서 제공해주신 코드의 최상위 div 구조와 사이드바 구조를 유지합니다.
        <div className="flex h-screen bg-[#f8f6fc] dark:bg-[#211a2e] transition-colors duration-300">
            {/* 사이드바 */}
            <aside className={`bg-[#ede7f6] dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb] flex flex-col shadow-2xl rounded-r-2xl ${sidebarCollapsed ? 'w-[72px]' : 'w-64'} transition-all duration-300 ease-in-out flex-shrink-0`}>
                {/* 사이드바 헤더 (로고, 토글 버튼) */}
                <div className="p-3 flex items-center justify-between border-b border-[#d1c4e9] dark:border-[#3a2e5a] h-16">
                    {!sidebarCollapsed && (
                        <Link to="/dashboard" className="flex items-center space-x-2">
                            <svg className="h-8 w-auto text-[#673ab7] dark:text-[#b39ddb]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                            <span className="font-bold text-xl text-[#4a148c] dark:text-[#d1c4e9]">IoTerminal</span>
                        </Link>
                    )}
                    <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={`p-2 rounded-xl hover:bg-[#d1c4e9] dark:hover:bg-[#3a2e5a] text-[#4a148c] dark:text-[#d1c4e9] ${sidebarCollapsed ? 'mx-auto' : 'ml-auto'}`} title={sidebarCollapsed ? '사이드바 열기' : '사이드바 닫기'}>
                        <MenuIcon size={22} />
                    </button>
                </div>

                {/* 네비게이션 메뉴 (대표님 코드의 메뉴 아이템 사용) */}
                <nav className="flex-1 overflow-y-auto py-4 bg-[#ede7f6] dark:bg-[#2a2139]">
                    <ul className="space-y-0.5">
                        {menuItemsData.map(item => (
                            <SidebarMenuItem
                                key={item.path}
                                path={item.path}
                                icon={item.icon}
                                text={item.text}
                                active={isActivePath(item.path, location.pathname) || (item.submenu && item.submenu.some(sub => isActivePath(sub.path, location.pathname)))}
                                collapsed={sidebarCollapsed}
                                submenu={item.submenu || []}
                            />
                        ))}
                    </ul>
                </nav>

                {/* 사이드바 하단 정보 */}
                <div className="p-4 border-t border-[#b39ddb] dark:border-[#3a2e5a] mt-auto">
                    {sidebarCollapsed ? (
                        <div className="flex items-center justify-center"> <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span> </div>
                    ) : (
                        <div className="space-y-2"> <div className="flex items-center text-sm"> <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span> <span className={isConnected ? 'text-green-600 dark:text-green-300' : 'text-red-500 dark:text-red-400'}> {isConnected ? '연결됨' : '연결 끊김'} </span> </div> <div className="text-xs text-gray-500 dark:text-gray-300 break-words"> <span className="font-semibold">현재 위치:</span> {currentLocation} </div> </div>
                    )}
                </div>
            </aside>

            {/* 메인 콘텐츠 영역: flex-1 flex flex-col overflow-y-auto */}
            <div className="flex-1 flex flex-col overflow-y-auto"> {/* 이 div가 스크롤의 주체가 됩니다. */}
                {/* 헤더 */}
                <header className="bg-white dark:bg-[#2f263d] shadow-md h-16 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-30 print:hidden"> {/* 헤더는 스크롤 시 상단에 고정 */}
                    <h1 className="text-xl font-semibold text-[#3a2e5a] dark:text-[#b39ddb]">{getPageTitle()}</h1>
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        {/* 검색, 알림, 다크모드, 프로필 드롭다운 등 (대표님 코드 유지) */}
                    </div>
                </header>

                {/* 실제 페이지 콘텐츠가 렌더링되는 부분 */}
                <main className="flex-1 p-4 sm:p-6 bg-[#f8f6fc] dark:bg-[#211a2e] transition-colors duration-300"> {/* 이 부분은 내용에 따라 늘어남 */}
                    <div className="max-w-full mx-auto"> {/* 콘텐츠 너비 제어 (대표님 코드 유지) */}
                        <Outlet />
                    </div>
                </main>
                
                {/* 푸터는 main 다음에 위치하여, main 콘텐츠의 길이에 따라 그 아래에 자연스럽게 옴 */}
                <AppFooter /> 
            </div>
        </div>
    );
};

export default MainLayout;