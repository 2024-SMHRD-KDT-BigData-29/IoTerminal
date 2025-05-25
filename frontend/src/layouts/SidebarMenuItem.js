import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const SidebarMenuItem = ({ path, icon, text, active = false, collapsed = false, submenu = [], currentPath }) => {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

    const handleToggleSubmenu = (e) => {
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
                        transition-all duration-200 cursor-pointer
                        ${active
                            ? 'bg-violet-200 text-violet-900 shadow-md dark:bg-[#3a2e5a] dark:text-[#b39ddb]'
                            : 'text-violet-500 hover:bg-violet-100 hover:text-violet-900 dark:text-[#b39ddb] dark:hover:bg-[#3a2e5a] dark:hover:text-[#ede7f6]'
                        }
                    `}
                    onClick={handleToggleSubmenu}
                    title={text}
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
                                        ${currentPath === item.path
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

export default SidebarMenuItem;