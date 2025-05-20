// File: frontend/src/layouts/MainLayout.js
import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
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
    LogOut
} from 'lucide-react';
import { getCurrentUserData, logout } from '../services/authService';

const SidebarMenuItem = ({ path, icon, text, active = false, collapsed = false, submenu = [] }) => {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
    const location = useLocation();

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
                    onClick={() => submenu.length > 0 && setIsSubmenuOpen(!isSubmenuOpen)}
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

const MainLayout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    
    const location = useLocation();

    const menuItemsData = [
        { path: '/dashboard', icon: <Activity size={20} />, text: '대시보드' },
        { path: '/workflow', icon: <Box size={20} />, text: '워크플로우' },
        { 
            path: '/iot-devices', 
            icon: <BarChart size={20} />, 
            text: 'IoT 디바이스',
            submenu: [
                { path: '/iot-devices', text: '디바이스 관리' },
                { path: '/iot-devices/data', text: '데이터 관리' }
            ]
        },
        { path: '/settings', icon: <Settings size={20} />, text: '설정' },
    ];

    const getPageTitle = () => {
        const menuItem = menuItemsData.find(item => location.pathname.startsWith(item.path));
        return menuItem ? menuItem.text : 'IoT Hub';
    };

    const currentUser = getCurrentUserData();

    return (
        <div className="flex h-screen bg-[#f8f6fc] dark:bg-[#2a2139] transition-colors duration-300">
            {/* 사이드바 */}
            <aside className={`bg-[#ede7f6] dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb] flex flex-col shadow-2xl rounded-r-2xl ${sidebarCollapsed ? 'w-[72px]' : 'w-64'} transition-all duration-300 ease-in-out flex-shrink-0`}>
                <div className="p-3 flex items-center justify-between border-b border-[#b39ddb] dark:border-[#3a2e5a] h-16">
                    {!sidebarCollapsed && (
                        <Link to="/dashboard" className="flex items-center space-x-2">
                            <svg className="h-8 w-auto text-[#b39ddb] dark:text-[#b39ddb]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                            </svg>
                            <span className="font-bold text-xl">IoT 허브</span>
                        </Link>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className={`p-2 rounded-xl hover:bg-[#d1c4e9] dark:hover:bg-[#3a2e5a] ${sidebarCollapsed ? 'mx-auto' : 'ml-auto'}`}
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
                                active={location.pathname.startsWith(item.path)}
                                collapsed={sidebarCollapsed}
                                submenu={item.submenu || []}
                            />
                        ))}
                    </ul>
                </nav>

                <div className="p-3 border-t border-[#b39ddb] dark:border-[#3a2e5a]">
                    <div className="relative">
                        <button
                            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                            className="flex items-center w-full p-2 rounded-xl hover:bg-[#d1c4e9] dark:hover:bg-[#3a2e5a]"
                        >
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-[#b39ddb] dark:bg-[#9575cd] flex items-center justify-center">
                                    <User size={20} />
                                </div>
                            </div>
                            {!sidebarCollapsed && (
                                <div className="ml-3 flex-1 text-left">
                                    <p className="text-sm font-medium">{currentUser.name}</p>
                                    <p className="text-xs text-[#9575cd] dark:text-[#b39ddb]">{currentUser.email}</p>
                                </div>
                            )}
                            {!sidebarCollapsed && <ChevronDown size={16} className="ml-2" />}
                        </button>
                    </div>
                </div>
            </aside>

            {/* 메인 콘텐츠 */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* 헤더 */}
                <header className="bg-[#b39ddb] dark:bg-[#3a2e5a] shadow-md h-16 flex items-center justify-between px-6 border-b border-[#b39ddb] dark:border-[#9575cd]">
                    <h1 className="text-xl font-semibold text-[#3a2e5a] dark:text-[#b39ddb]">{getPageTitle()}</h1>
                    <div className="flex items-center space-x-4">
                        <button className="p-2 hover:bg-[#d1c4e9] dark:hover:bg-[#9575cd]" title="검색">
                            <Search size={20} className="text-[#9575cd] dark:text-[#b39ddb]" />
                        </button>
                        <button className="p-2 hover:bg-[#d1c4e9] dark:hover:bg-[#9575cd]" title="알림">
                            <Bell size={20} className="text-[#9575cd] dark:text-[#b39ddb]" />
                        </button>
                        <button className="p-2 hover:bg-[#d1c4e9] dark:hover:bg-[#9575cd]" title="도움말">
                            <HelpCircle size={20} className="text-[#9575cd] dark:text-[#b39ddb]" />
                        </button>
                        <button
                            className="p-2 hover:bg-[#d1c4e9] dark:hover:bg-[#9575cd]"
                            title="다크모드 토글"
                            onClick={() => {
                                document.documentElement.classList.toggle('dark');
                            }}
                        >
                            <svg className="w-5 h-5 text-[#9575cd] dark:text-[#b39ddb]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.93l-.71-.71" /><circle cx="12" cy="12" r="5" /></svg>
                        </button>
                    </div>
                </header>

                {/* 메인 콘텐츠 영역 */}
                <main className="flex-1 overflow-y-auto bg-white dark:bg-[#2a2139] p-6 transition-colors duration-300 rounded-2xl mt-4 mx-4 shadow-lg">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;