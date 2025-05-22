// File: frontend/src/layouts/MainLayout.js
import React, { useState, useEffect, useRef } from 'react'; // useRef, useEffect 추가
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
    Moon, // 다크모드 아이콘 (예시, 필요시 Sun 아이콘도 추가)
    Sun, // 라이트모드 아이콘 (예시)
    LineChart // 데이터 분석 아이콘 추가
} from 'lucide-react';
import { getCurrentUserData, logout } from '../services/authService';
import io from 'socket.io-client';

const SidebarMenuItem = ({ path, icon, text, active = false, collapsed = false, submenu = [] }) => {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
    const location = useLocation();

    const handleItemClick = (e) => {
        if (submenu.length > 0) {
            e.preventDefault(); // Link의 기본 동작 방지
            setIsSubmenuOpen(!isSubmenuOpen);
        }
        // submenu가 없으면 Link의 기본 동작(페이지 이동) 수행
    };

    return (
        <li>
            <div className="flex flex-col">
                <Link
                    to={path}
                    className={`
                        flex items-center px-3 py-2.5 text-sm font-medium rounded-2xl mx-2 mb-1
                        transition-all duration-200
                        ${active
                            ? 'bg-violet-200 text-violet-900 shadow-md dark:bg-[#3a2e5a] dark:text-[#b39ddb]'
                            : 'text-violet-500 hover:bg-violet-100 hover:text-violet-900 dark:text-[#b39ddb] dark:hover:bg-[#3a2e5a] dark:hover:text-[#ede7f6]'
                        }
                    `}
                    title={text}
                    onClick={handleItemClick} // 수정된 클릭 핸들러
                >
                    <span className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}>{icon}</span>
                    {!collapsed && (
                        <>
                            <span className="truncate flex-1">{text}</span>
                            {submenu.length > 0 && (
                                <ChevronDown
                                    size={16}
                                    className={`transform transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`}
                                />
                            )}
                        </>
                    )}
                </Link>
                {!collapsed && isSubmenuOpen && submenu.length > 0 && (
                    <ul className="ml-6 mt-1 space-y-1">
                        {submenu.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`
                                        block px-3 py-2 text-sm font-medium rounded-xl
                                        ${location.pathname === item.path
                                            ? 'bg-violet-100 text-violet-900 dark:bg-[#3a2e5a] dark:text-[#b39ddb]'
                                            : 'text-violet-500 hover:bg-violet-50 hover:text-violet-900 dark:text-[#b39ddb] dark:hover:bg-[#3a2e5a] dark:hover:text-[#ede7f6]'
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

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

const MainLayout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    // const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false); // 필요시 사용
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark')); // 다크모드 상태 추가
    const [isConnected, setIsConnected] = useState(false);
    const [currentLocation, setCurrentLocation] = useState('위치 확인 중...');

    const navigate = useNavigate();
    const location = useLocation();
    const profileDropdownRef = useRef(null); // 드롭다운 외부 클릭 감지를 위한 ref

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
            if (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'))) {
                return item.text;
            }
            if (item.submenu) {
                for (const subItem of item.submenu) {
                    if (location.pathname === subItem.path || (subItem.path !== '/' && location.pathname.startsWith(subItem.path + '/'))) {
                        return subItem.text; // 서브메뉴 타이틀도 고려
                    }
                }
            }
        }
        return 'IoTerminal'; // 기본 타이틀
    };


    const currentUser = getCurrentUserData() || { name: 'Guest', email: 'guest@example.com' }; // 로그인 안했을 때 대비

    const handleLogout = () => {
        // localStorage에서 사용자 정보 제거는 authService.logout() 내부에서 처리하는 것이 좋음
        // localStorage.removeItem('user');
        // localStorage.removeItem('token');
        logout(); // authService의 logout 함수가 토큰 및 사용자 정보 제거 담당
        navigate('/login');
    };

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle('dark');
        setIsDarkMode(!isDarkMode); // 상태 업데이트
        // 필요하다면 사용자의 다크모드 설정을 localStorage에 저장
    };
    
    // 드롭다운 외부 클릭 시 닫기
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


    // SidebarMenuItem에서 active 상태를 정확하게 판단하기 위한 로직 수정
    const isActivePath = (itemPath, currentPath) => {
        if (itemPath === '/dashboard' && currentPath === '/dashboard') return true; // 대시보드는 정확히 일치할 때만
        if (itemPath !== '/dashboard' && itemPath !== '/' && currentPath.startsWith(itemPath)) return true;
        // submenu의 경우, 부모 메뉴가 active될 수 있도록 submenu path도 검사
        const parentItem = menuItemsData.find(menu => menu.submenu?.some(sub => sub.path === itemPath));
        if(parentItem && currentPath.startsWith(parentItem.path)) return true;

        return false;
    };

    // 소켓 연결 상태
    useEffect(() => {
        const socket = io(SOCKET_SERVER_URL, { transports: ['websocket'] });
        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));
        socket.on('connect_error', () => setIsConnected(false));
        return () => socket.disconnect();
    }, []);

    // 현재 위치 주소
    useEffect(() => {
        if (!navigator.geolocation) {
            setCurrentLocation('위치 정보 사용 불가');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                    );
                    const data = await res.json();
                    setCurrentLocation(data.display_name || '주소 정보 없음');
                } catch {
                    setCurrentLocation('주소 변환 실패');
                }
            },
            () => setCurrentLocation('위치 권한 필요')
        );
    }, []);

    return (
        <div className="flex h-screen bg-[#f8f6fc] dark:bg-[#211a2e] transition-colors duration-300">
            {/* 사이드바 */}
            <aside className={`bg-[#ede7f6] dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb] flex flex-col shadow-2xl rounded-r-2xl ${sidebarCollapsed ? 'w-[72px]' : 'w-64'} transition-all duration-300 ease-in-out flex-shrink-0`}>
                <div className="p-3 flex items-center justify-between border-b border-[#d1c4e9] dark:border-[#3a2e5a] h-16">
                    {!sidebarCollapsed && (
                        <Link to="/dashboard" className="flex items-center space-x-2">
                            <svg className="h-8 w-auto text-[#673ab7] dark:text-[#b39ddb]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                            </svg>
                            <span className="font-bold text-xl text-[#4a148c] dark:text-[#d1c4e9]">IoTerminal</span>
                        </Link>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className={`p-2 rounded-xl hover:bg-[#d1c4e9] dark:hover:bg-[#3a2e5a] text-[#4a148c] dark:text-[#d1c4e9] ${sidebarCollapsed ? 'mx-auto' : 'ml-auto'}`}
                        title={sidebarCollapsed ? '사이드바 열기' : '사이드바 닫기'}
                    >
                        <MenuIcon size={22} />
                    </button>
                </div>

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
                        // 접힘: 연결상태 점만
                        <div className="flex items-center justify-center">
                            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </div>
                    ) : (
                        // 펼침: 연결상태(점+텍스트) + 현재 위치
                        <div className="space-y-2">
                            <div className="flex items-center text-sm">
                                <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span className={isConnected ? 'text-green-600' : 'text-red-500'}>
                                    {isConnected ? '연결됨' : '연결 끊김'}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-300 break-words">
                                <span className="font-semibold">현재 위치:</span> {currentLocation}
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* 메인 콘텐츠 */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* 헤더 */}
                <header className="bg-white dark:bg-[#2f263d] shadow-md h-16 flex items-center justify-between px-6">
                    <h1 className="text-xl font-semibold text-[#3a2e5a] dark:text-[#b39ddb]">{getPageTitle()}</h1>
                    
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        {/* 검색 버튼 (필요시) */}
                        <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#3a2e5a]" title="검색">
                            <Search size={20} className="text-gray-600 dark:text-[#b39ddb]" />
                        </button>
                        
                        {/* 알림 버튼 (필요시) */}
                        <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#3a2e5a]" title="알림">
                            <Bell size={20} className="text-gray-600 dark:text-[#b39ddb]" />
                        </button>

                        {/* 다크모드 토글 버튼 */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#3a2e5a]"
                            title={isDarkMode ? '라이트 모드' : '다크 모드'}
                        >
                            {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-600" />}
                        </button>

                        {/* 사용자 프로필 드롭다운 - 여기로 이동! */}
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
                                            to="/help" // 도움말 페이지 경로 (예시)
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

                {/* 메인 콘텐츠 영역 */}
                <main className="flex-1 overflow-y-auto bg-[#f8f6fc] dark:bg-[#211a2e] p-4 sm:p-6 transition-colors duration-300">
                     {/* 원래 있던 rounded-2xl mt-4 mx-4 shadow-lg 스타일은 여기서 제거하고, 전체 배경색으로 통일감을 줌 */}
                    <div className="max-w-full mx-auto"> {/* max-w-7xl 에서 max-w-full로 변경하여 좀 더 넓게 사용 */}
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;