import React from 'react';
import { Link } from 'react-router-dom';
import { Menu as MenuIcon } from 'lucide-react';
import SidebarMenuItem from './SidebarMenuItem';

const Sidebar = ({ sidebarCollapsed, setSidebarCollapsed, menuItemsData, isActivePath, currentPath, isConnected, currentLocation }) => {
    return (
        <aside className={`bg-[var(--sidebar-footer-bg)] dark:bg-[var(--sidebar-footer-dark-bg)] text-[#3a2e5a] dark:text-[#b39ddb] flex flex-col ${sidebarCollapsed ? 'w-[72px]' : 'w-64'} transition-all duration-300 ease-in-out flex-shrink-0 z-10 min-h-screen sticky top-0`}>
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

            <nav className="flex-1 overflow-y-auto py-4 bg-[var(--sidebar-footer-bg)] dark:bg-[var(--sidebar-footer-dark-bg)]">
                <ul className="space-y-0.5">
                    {menuItemsData?.map(item => (
                        <SidebarMenuItem
                            key={item.path}
                            path={item.path}
                            icon={item.icon}
                            text={item.text}
                            active={isActivePath(item.path, currentPath) || (item.submenu && item.submenu.some(sub => isActivePath(sub.path, currentPath)))}
                            collapsed={sidebarCollapsed}
                            submenu={item.submenu || []}
                            currentPath={currentPath}
                        />
                    )) || <li className="px-4 py-2 text-sm text-gray-500">메뉴 항목 없음</li>}
                </ul>
            </nav>

            <div className="p-4 border-t border-[#b39ddb] dark:border-[#3a2e5a] mt-auto">
                {sidebarCollapsed ? (
                    <div className="flex items-center justify-center">
                        <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </div>
                ) : (
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
    );
};

export default Sidebar;