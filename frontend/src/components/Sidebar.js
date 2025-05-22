import { FaHome, FaUser, FaCog, FaChartLine } from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';

const menuItems = [
    { path: '/', icon: <FaHome />, label: '홈' },
    { path: '/profile', icon: <FaUser />, label: '프로필' },
    { path: '/analysis', icon: <FaChartLine />, label: '데이터 분석' },
    { path: '/settings', icon: <FaCog />, label: '설정' }
]; 

const Sidebar = () => {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        socketRef.current = io(SOCKET_SERVER_URL, { transports: ['websocket'] });
        socketRef.current.on('connect_error', (err) => { 
            console.error("Socket.IO connection error:", err.message); 
            setIsConnected(false); 
        });
        socketRef.current.on('connect', () => setIsConnected(true));
        socketRef.current.on('disconnect', () => setIsConnected(false));

        return () => { 
            if (socketRef.current) socketRef.current.disconnect(); 
        };
    }, []);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            {/* 기존 사이드바 내용 */}
            <div className="flex-1">
                {/* ... existing sidebar content ... */}
            </div>

            {/* 소켓 상태 표시 */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">연결 상태:</span>
                    <span className={`flex items-center ${
                        isConnected ? 'text-green-500' : 'text-red-500'
                    }`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                            isConnected ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                        {isConnected ? '연결됨' : '연결 끊김'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar; 