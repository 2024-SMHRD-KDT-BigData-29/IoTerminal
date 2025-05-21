import { FaHome, FaUser, FaCog, FaChartLine } from 'react-icons/fa';

const menuItems = [
    { path: '/', icon: <FaHome />, label: '홈' },
    { path: '/profile', icon: <FaUser />, label: '프로필' },
    { path: '/analysis', icon: <FaChartLine />, label: '데이터 분석' },
    { path: '/settings', icon: <FaCog />, label: '설정' }
]; 