// File: frontend/src/pages/DashboardPage.js
// (이전 답변 "3.8을 다시 출력해줘"에서 제공된 DashboardPage.js 전체 코드를 사용하되,
// MainLayout에서 이미 상단 헤더(검색, 알림 등)를 제공하므로, 
// DashboardPage 자체에서는 페이지 제목("Dashboard Overview")과 그 아래 콘텐츠만 집중합니다.)

// 대표님이 제공해주신 `dashboard-layout.tsx`의 <main> 태그 내부 콘텐츠를 여기에 구현합니다.
// SummaryCard, SensorStatusItem, WorkflowItem, ApiItem 컴포넌트 정의는
// 이전 답변("3.8을 다시 출력해줘"에 대한 응답)의 DashboardPage.js 코드에 이미 포함되어 있습니다.
// 해당 컴포넌트들을 사용하여 UI를 구성합니다.

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Link 임포트 추가
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import io from 'socket.io-client';
import { 
    Activity, Database, Shield, Globe, Thermometer, Droplet, Zap, Wind, AlertTriangle
} from 'lucide-react';
import { getDashboardSummary, getSensorStatuses, getRecentWorkflowsForDashboard, getApiStatusesForDashboard } from '../services/dashboardService';
import { getRecentWorkflows } from '../api/workflow';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ko from 'date-fns/locale/ko';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../services/calendarService';
import { getCurrentUserData } from '../services/authService';

const SOCKET_SERVER_URL = 'http://localhost:3001';
const MAX_DATA_POINTS_LINE_CHART = 30;

const locales = {
    'ko': ko,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

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
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const user = getCurrentUserData();
    const userId = user?.user_id;  // user_id만 사용

    // 캘린더 이벤트 로드
    useEffect(() => {
        const loadCalendarEvents = async () => {
            try {
                setIsLoadingEvents(true);
                const response = await getCalendarEvents();
                if (response.success) {
                    const formattedEvents = response.events.map((event, idx) => ({
                        ...event,
                        id: event.id || `event-${event.start}-${event.end}-${idx}`,
                        start: new Date(event.start),
                        end: new Date(event.end)
                    }));
                    setEvents(formattedEvents);
                }
            } catch (error) {
                console.error('일정 로드 실패:', error);
            } finally {
                setIsLoadingEvents(false);
            }
        };

        loadCalendarEvents();
    }, []);

    // 이벤트가 변경될 때마다 로컬 스토리지에 저장
    useEffect(() => {
        localStorage.setItem('calendar_events', JSON.stringify(events));
    }, [events]);

    // 이벤트 추가 모달 상태
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [newEvent, setNewEvent] = useState({
        title: '',
        start: null,
        end: null,
        desc: ''
    });

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

    useEffect(() => {
        const fetchRecentWorkflows = async () => {
            try {
                const response = await getRecentWorkflows();
                if (response.success) {
                    setRecentWorkflows(response.workflows);
                }
            } catch (error) {
                console.error('최근 워크플로우 조회 실패:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecentWorkflows();
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

    // 이벤트 저장
    const handleSaveEvent = async () => {
        if (!userId) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        if (!newEvent.title || !newEvent.start || !newEvent.end) {
            alert('제목, 시작 시간, 종료 시간은 필수 입력 항목입니다.');
            return;
        }

        try {
            const eventData = {
                ...newEvent,
                user_id: userId,
                start: newEvent.start.toISOString(),
                end: newEvent.end.toISOString()
            };

            let response;
            if (selectedEvent) {
                // 이벤트 수정
                response = await updateCalendarEvent(selectedEvent.id, eventData);
            } else {
                // 새 이벤트 추가
                response = await createCalendarEvent(eventData);
            }

            if (response.success) {
                if (selectedEvent) {
                    setEvents(events.map(event => 
                        event.id === selectedEvent.id ? { ...eventData, id: event.id } : event
                    ));
                } else {
                    setEvents([...events, { ...eventData, id: response.event.id }]);
                }
                setShowEventModal(false);
                setSelectedEvent(null);
                setNewEvent({ title: '', start: null, end: null, desc: '' });
            }
        } catch (error) {
            console.error('일정 저장 실패:', error);
            if (error.authError) {
                alert('로그인이 필요합니다.');
                navigate('/login');
            } else {
                alert(error.message || '일정 저장에 실패했습니다.');
            }
        }
    };

    // 이벤트 삭제
    const handleDeleteEvent = async (eventId) => {
        if (!userId) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        if (!window.confirm('정말로 이 일정을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await deleteCalendarEvent(eventId);
            if (response.success) {
                setEvents(events.filter(event => event.id !== eventId));
                setShowEventModal(false);
                setSelectedEvent(null);
            }
        } catch (error) {
            console.error('일정 삭제 실패:', error);
            if (error.authError) {
                alert('로그인이 필요합니다.');
                navigate('/login');
            } else {
                alert(error.message || '일정 삭제에 실패했습니다.');
            }
        }
    };

    // 이벤트 선택 핸들러
    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setNewEvent({
            title: event.title,
            start: event.start,
            end: event.end,
            desc: event.desc
        });
        setShowEventModal(true);
    };

    // 새 이벤트 생성 핸들러
    const handleSelect = ({ start, end }) => {
        setSelectedEvent(null);
        setNewEvent({
            title: '',
            start,
            end,
            desc: ''
        });
        setShowEventModal(true);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Connection Status */}
            <div className="text-xs text-right text-gray-500 dark:text-gray-400"> 
                Socket Status: {isConnected ? 
                    <span className="text-green-500 font-semibold">Connected</span> : 
                    <span className="text-red-500 font-semibold">Disconnected</span>}
            </div>

            {/* Summary Cards Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard title="활성 센서" value={summaryData.activeSensors} change="+2" up={true} icon={<Activity size={20} className="text-blue-500" />} />
                <SummaryCard title="수집 데이터 (오늘)" value={summaryData.dataCollected} change="+12%" up={true} icon={<Database size={20} className="text-green-500" />} />
                <SummaryCard title="오류율" value={summaryData.errorRate} change="-0.6%" up={false} icon={<Shield size={20} className="text-red-500" />} />
                <SummaryCard title="API 호출 (오늘)" value={summaryData.apiCalls} change="+5%" up={true} icon={<Globe size={20} className="text-purple-500" />} />
            </div>
            
            {/* Main Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 실시간 데이터 스트림 */}
                <div className="bg-white dark:bg-[#3a2e5a] rounded-xl shadow-lg p-4 lg:col-span-2">
                    <div className="flex flex-wrap justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-[#b39ddb]">실시간 데이터 스트림</h3>
                        <select 
                            value={dateRangeFilter} 
                            onChange={(e) => setDateRangeFilter(e.target.value)}
                            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#4a3f6d] bg-white dark:bg-[#2a2139] text-gray-700 dark:text-[#b39ddb] focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="today">오늘</option>
                            <option value="this_week">이번 주</option>
                            <option value="this_month">이번 달</option>
                        </select>
                    </div>
                    <div className="h-[400px]">
                        {liveSensorData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={liveSensorData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis dataKey="time" tick={{fontSize: 12, fill: '#666'}} />
                                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tick={{fontSize: 12, fill: '#666'}} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tick={{fontSize: 12, fill: '#666'}} />
                                    <Tooltip 
                                        wrapperStyle={{
                                            fontSize: '12px',
                                            backgroundColor: 'rgba(255,255,255,0.9)',
                                            borderRadius: '8px',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                    <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                                    <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 5 }} name="온도 (°C)" dot={false} />
                                    <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#82ca9d" strokeWidth={2} activeDot={{ r: 5 }} name="습도 (%)" dot={false} />
                                    {liveSensorData[0]?.pressure !== undefined && 
                                        <Line yAxisId="left" type="monotone" dataKey="pressure" stroke="#ffc658" strokeWidth={2} activeDot={{ r: 5 }} name="압력 (hPa)" dot={false} />
                                    }
                                    {liveSensorData[0]?.lightLevel !== undefined && 
                                        <Line yAxisId="right" type="monotone" dataKey="lightLevel" stroke="#ff7f0e" strokeWidth={2} activeDot={{ r: 5 }} name="조도 (lux)" dot={false} />
                                    }
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full bg-gray-50 dark:bg-[#2a2139] rounded-lg flex items-center justify-center">
                                <span className="text-gray-400 dark:text-gray-500 italic">실시간 센서 데이터 수신 대기 중...</span>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* 디바이스 상태 및 일정 관리 */}
                <div className="space-y-4">
                    {/* 디바이스 상태 */}
                    <div className="bg-white dark:bg-[#3a2e5a] rounded-xl shadow-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-[#b39ddb]">디바이스 상태</h3>
                            <Link 
                                to="/iot/devices" 
                                className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                            >
                                전체 보기
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {sensorStatuses.length > 0 ? sensorStatuses.map((sensor, idx) => (
                                <div 
                                    key={sensor.id || `sensor-${idx}`}
                                    className="bg-gray-50 dark:bg-[#2a2139] rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-[#3a2e5a] transition-colors duration-200 cursor-pointer"
                                    onClick={() => navigate(`/iot/devices/${sensor.id}`)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                {React.createElement(getIconComponentForSensor(sensor.name), {
                                                    size: 20,
                                                    className: "text-purple-600 dark:text-purple-400"
                                                })}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-700 dark:text-[#b39ddb]">
                                                    {sensor.name}
                                                </h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {sensor.value}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            sensor.status === 'active' 
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {sensor.status === 'active' ? '정상' : '오류'}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center bg-gray-50 dark:bg-[#2a2139] rounded-lg">
                                    등록된 디바이스가 없습니다
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 일정 관리 */}
                    <div className="bg-white dark:bg-[#3a2e5a] rounded-xl shadow-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-[#b39ddb] mb-4">일정 관리</h3>
                        <div className="h-[300px]">
                            {isLoadingEvents ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                                </div>
                            ) : (
                                <Calendar
                                    localizer={localizer}
                                    events={events}
                                    startAccessor="start"
                                    endAccessor="end"
                                    style={{ height: '100%' }}
                                    onSelectSlot={handleSelect}
                                    onSelectEvent={handleSelectEvent}
                                    selectable
                                    views={['month', 'week', 'day']}
                                    messages={{
                                        next: "다음",
                                        previous: "이전",
                                        today: "오늘",
                                        month: "월",
                                        week: "주",
                                        day: "일",
                                        agenda: "일정",
                                        date: "날짜",
                                        time: "시간",
                                        event: "일정",
                                        noEventsInRange: "일정이 없습니다.",
                                    }}
                                    className="dark:bg-[#2a2139] dark:text-[#b39ddb]"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* 워크플로우 섹션 */}
            <div className="bg-white dark:bg-[#3a2e5a] rounded-xl shadow-lg p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-[#b39ddb]">최근 워크플로우</h3>
                    <Link 
                        to="/workflow/new" 
                        className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                    >
                        새로 만들기
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoading ? (
                        <div className="col-span-full flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                        </div>
                    ) : recentWorkflows.length > 0 ? (
                        recentWorkflows.map((workflow, idx) => (
                            <div 
                                key={workflow.workflow_id || `workflow-${idx}`}
                                className="bg-[#f8f6fc] dark:bg-[#2a2139] rounded-lg p-4 cursor-pointer hover:bg-[#ede7f6] dark:hover:bg-[#3a2e5a] transition-colors duration-200"
                                onClick={() => navigate(`/workflow/edit/${workflow.workflow_id}`)}
                            >
                                <h4 className="font-medium text-gray-700 dark:text-[#b39ddb] mb-2">
                                    {workflow.name}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    마지막 수정: {new Date(workflow.updated_at).toLocaleDateString()}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                            최근 워크플로우가 없습니다.
                        </div>
                    )}
                </div>
            </div>

            {/* 이벤트 모달 */}
            {showEventModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#3a2e5a] rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-[#b39ddb] mb-4">
                            {selectedEvent ? '일정 수정' : '새 일정'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-[#b39ddb] mb-1">
                                    제목
                                </label>
                                <input
                                    type="text"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#4a3f6d] bg-white dark:bg-[#2a2139] text-gray-700 dark:text-[#b39ddb]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-[#b39ddb] mb-1">
                                    시작 시간
                                </label>
                                <input
                                    type="datetime-local"
                                    value={newEvent.start ? newEvent.start.toISOString().slice(0, 16) : ''}
                                    onChange={(e) => setNewEvent({ ...newEvent, start: new Date(e.target.value) })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#4a3f6d] bg-white dark:bg-[#2a2139] text-gray-700 dark:text-[#b39ddb]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-[#b39ddb] mb-1">
                                    종료 시간
                                </label>
                                <input
                                    type="datetime-local"
                                    value={newEvent.end ? newEvent.end.toISOString().slice(0, 16) : ''}
                                    onChange={(e) => setNewEvent({ ...newEvent, end: new Date(e.target.value) })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#4a3f6d] bg-white dark:bg-[#2a2139] text-gray-700 dark:text-[#b39ddb]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-[#b39ddb] mb-1">
                                    설명
                                </label>
                                <textarea
                                    value={newEvent.desc}
                                    onChange={(e) => setNewEvent({ ...newEvent, desc: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#4a3f6d] bg-white dark:bg-[#2a2139] text-gray-700 dark:text-[#b39ddb]"
                                    rows="3"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                            {selectedEvent && (
                                <button
                                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                >
                                    삭제
                                </button>
                            )}
                            <button
                                onClick={() => setShowEventModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-[#b39ddb] hover:bg-gray-100 dark:hover:bg-[#4a3f6d] rounded-lg"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSaveEvent}
                                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 rounded-lg"
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DashboardPage;