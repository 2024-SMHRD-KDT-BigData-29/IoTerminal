// File: frontend/src/pages/DashboardPage.js
// (이전 답변 "3.8을 다시 출력해줘"에서 제공된 DashboardPage.js 전체 코드를 사용하되,
// MainLayout에서 이미 상단 헤더(검색, 알림 등)를 제공하므로, 
// DashboardPage 자체에서는 페이지 제목("Dashboard Overview")과 그 아래 콘텐츠만 집중합니다.)

// 대표님이 제공해주신 `dashboard-layout.tsx`의 <main> 태그 내부 콘텐츠를 여기에 구현합니다.
// SummaryCard, SensorStatusItem, WorkflowItem, ApiItem 컴포넌트 정의는
// 이전 답변("3.8을 다시 출력해줘"에 대한 응답)의 DashboardPage.js 코드에 이미 포함되어 있습니다.
// 해당 컴포넌트들을 사용하여 UI를 구성합니다.

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom'; // Link 임포트 추가
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import io from 'socket.io-client';
import { 
    Activity, Database, Shield, Globe, Thermometer, Droplet, Zap, Wind, AlertTriangle
} from 'lucide-react';
import { getDashboardSummary, getSensorStatuses, getRecentWorkflowsForDashboard, getApiStatusesForDashboard } from '../services/dashboardService';

const SOCKET_SERVER_URL = 'http://localhost:3001';
const MAX_DATA_POINTS_LINE_CHART = 30;

// --- Reusable Components (SummaryCard, SensorStatusItem, WorkflowItem, ApiItem) ---
// (이 컴포넌트들의 정의는 이전 답변의 DashboardPage.js 코드와 동일하게 유지합니다. 
//  여기서는 지면 관계상 생략하고, 이전 답변 코드를 참고하여 여기에 포함시켜주세요.)
const SummaryCard = ({ title, value, change, up, icon }) => { /* ... */ };
const SensorStatusItem = ({ name, status, value, IconComponent }) => { /* ... */ };
const WorkflowItem = ({ name, time, status, statusColor }) => { /* ... */ };
const ApiItem = ({ name, status, statusColor, calls }) => { /* ... */ };
// --- End Reusable Components ---

function DashboardPage() {
    const [liveSensorData, setLiveSensorData] = useState([]);
    const [isConnected, setIsConnected] = useState(false); // Socket.IO 연결 상태
    const socketRef = useRef(null);

    const [summaryData, setSummaryData] = useState({ activeSensors: 0, dataCollected: "0", errorRate: "0%", apiCalls: "0" });
    const [sensorStatuses, setSensorStatuses] = useState([]);
    const [recentWorkflows, setRecentWorkflows] = useState([]);
    const [apiStatuses, setApiStatuses] = useState([]);
    const [dateRangeFilter, setDateRangeFilter] = useState('today'); // For chart filter

    // Fetch initial dashboard data from mock backend
    useEffect(() => {
        const fetchAllDashboardData = async () => {
            try {
                const [summary, statuses, workflows, apis] = await Promise.all([
                    getDashboardSummary(),
                    getSensorStatuses(),
                    getRecentWorkflowsForDashboard(),
                    getApiStatusesForDashboard()
                ]);
                setSummaryData(summary);
                setSensorStatuses(statuses);
                setRecentWorkflows(workflows);
                setApiStatuses(apis);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };
        fetchAllDashboardData();
    }, []);

    // Socket.IO connection for live data
    useEffect(() => {
        socketRef.current = io(SOCKET_SERVER_URL, { transports: ['websocket'] });
        socketRef.current.on('connect', () => setIsConnected(true));
        socketRef.current.on('disconnect', () => setIsConnected(false));
        socketRef.current.on('newSensorData', (newData) => {
            setLiveSensorData(prevData => {
                const enrichedData = { 
                    ...newData, 
                    time: new Date(newData.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                };
                const updatedData = [...prevData, enrichedData];
                return updatedData.slice(-MAX_DATA_POINTS_LINE_CHART);
            });
        });
        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, []);

    const getIconComponentForSensor = (sensorName = "") => { // Returns Component Type
        const lowerSensorName = sensorName.toLowerCase();
        if (lowerSensorName.includes("온도") || lowerSensorName.includes("temperature")) return Thermometer;
        if (lowerSensorName.includes("습도") || lowerSensorName.includes("humidity")) return Droplet;
        if (lowerSensorName.includes("전류") || lowerSensorName.includes("current")) return Zap;
        if (lowerSensorName.includes("압력") || lowerSensorName.includes("pressure")) return Wind;
        if (lowerSensorName.includes("가스") || lowerSensorName.includes("gas")) return AlertTriangle;
        return Activity;
    };

    return (
        <> {/* MainLayout이 <main> 태그를 제공하므로, 여기서는 Fragment 사용 */}
            {/* Connection Status (moved from MainLayout's page title to here for context) */}
            <div className="mb-4 text-xs text-right"> 
                Socket Status: {isConnected ? 
                    <span className="text-green-500 font-semibold">Connected</span> : 
                    <span className="text-red-500 font-semibold">Disconnected</span>}
            </div>

            {/* Summary Cards Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <SummaryCard title="활성 센서" value={summaryData.activeSensors} change="+2" up={true} icon={<Activity size={20} className="text-blue-500" />} />
                <SummaryCard title="수집 데이터 (오늘)" value={summaryData.dataCollected} change="+12%" up={true} icon={<Database size={20} className="text-green-500" />} />
                <SummaryCard title="오류율" value={summaryData.errorRate} change="-0.6%" up={false} icon={<Shield size={20} className="text-red-500" />} />
                <SummaryCard title="API 호출 (오늘)" value={summaryData.apiCalls} change="+5%" up={true} icon={<Globe size={20} className="text-purple-500" />} />
            </div>
            
            {/* Charts and Sensor Status Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:col-span-2 hover:shadow-2xl transition-shadow">
                    <div className="flex flex-wrap justify-between items-center mb-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-700">실시간 데이터 스트림</h3>
                        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                            <select 
                                value={dateRangeFilter} 
                                onChange={(e) => setDateRangeFilter(e.target.value)}
                                className="text-xs sm:text-sm px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                            >
                                <option value="today">Today</option>
                                <option value="this_week">This Week</option>
                                <option value="this_month">This Month</option>
                            </select>
                        </div>
                    </div>
                    <div className="h-72 sm:h-80 w-full">
                        {liveSensorData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={liveSensorData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis dataKey="time" tick={{fontSize: 10, fill: '#666'}} />
                                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tick={{fontSize: 10, fill: '#666'}} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tick={{fontSize: 10, fill: '#666'}} />
                                    <Tooltip wrapperStyle={{fontSize: '12px'}} contentStyle={{backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}/>
                                    <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                                    <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 5 }} name="온도 (°C)" dot={false} />
                                    <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#82ca9d" strokeWidth={2} activeDot={{ r: 5 }} name="습도 (%)" dot={false} />
                                    {liveSensorData[0]?.pressure !== undefined && <Line yAxisId="left" type="monotone" dataKey="pressure" stroke="#ffc658" strokeWidth={2} activeDot={{ r: 5 }} name="압력 (hPa)" dot={false} />}
                                    {liveSensorData[0]?.lightLevel !== undefined && <Line yAxisId="right" type="monotone" dataKey="lightLevel" stroke="#ff7f0e" strokeWidth={2} activeDot={{ r: 5 }} name="조도 (lux)" dot={false} />}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full bg-gray-50 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400 italic">실시간 센서 데이터 수신 대기 중...</span>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-2xl transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-700">센서 상태</h3>
                        {/* <button className="text-sky-600 hover:text-sky-700 text-sm font-medium">View All</button> */}
                    </div>
                    <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
                        {sensorStatuses.length > 0 ? sensorStatuses.map((sensor, index) => (
                            <SensorStatusItem 
                                key={index} 
                                name={sensor.name} 
                                status={sensor.status} 
                                value={sensor.value}
                                IconComponent={getIconComponentForSensor(sensor.name)}
                            />
                        )) : <p className="text-sm text-gray-500 py-4 text-center">센서 상태 정보 없음.</p>}
                    </div>
                </div>
            </div>
            
            {/* Workflow and API Status Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-2xl transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-700">최근 워크플로우</h3>
                        <Link to="/workflow/new" className="text-sky-600 hover:text-sky-700 text-sm font-medium">새로 만들기</Link>
                    </div>
                    <div className="space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
                        {recentWorkflows.length > 0 ? recentWorkflows.map((wf, index) => (
                            <WorkflowItem 
                                key={index} 
                                name={wf.name} 
                                time={wf.time} 
                                status={wf.status} 
                                statusColor={wf.statusColor} 
                            />
                        )) : <p className="text-sm text-gray-500 py-4 text-center">최근 워크플로우 활동 없음.</p>}
                    </div>
                </div>
            </div>
        </>
    );
}

export default DashboardPage;