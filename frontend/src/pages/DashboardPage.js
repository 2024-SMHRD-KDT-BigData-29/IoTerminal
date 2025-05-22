// File: frontend/src/pages/DashboardPage.js

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import io from 'socket.io-client';
import { 
    Activity, Database, Shield, Globe, Thermometer, Droplet, Zap, Wind, AlertTriangle
} from 'lucide-react'; // ChevronRight는 JSX에서 사용되지 않아 일단 제거
import { getDashboardSummary, getSensorStatuses, getRecentWorkflowsForDashboard, getApiStatusesForDashboard } from '../services/dashboardService';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ko from 'date-fns/locale/ko';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../services/calendarService';
import { getCurrentUserData } from '../services/authService';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
const MAX_DATA_POINTS_LINE_CHART = 30;

const locales = { 'ko': ko };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// --- Reusable Components (실제 예시 정의) ---
const SummaryCard = ({ title, value, change, up, icon }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center">
                {icon && <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-lg mr-4">{icon}</div>}
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
                    {change && (
                        <p className={`text-xs font-medium ${up ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                            {change}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

const SensorStatusItem = ({ name, status, value, IconComponent }) => {
    return (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-500/20 rounded-md">
                        {IconComponent && <IconComponent size={18} className="text-purple-600 dark:text-purple-400" />}
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">{name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{value}</p>
                    </div>
                </div>
                <div className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                    {status === 'active' ? '정상' : '오류'}
                </div>
            </div>
        </div>
    );
};

const WorkflowItem = ({ name, time }) => {
    return (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate mb-1">{name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">마지막 수정: {time}</p>
        </div>
    );
};
// --- End Reusable Components ---

function DashboardPage() {
    const [liveSensorData, setLiveSensorData] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    const [summaryData, setSummaryData] = useState({ activeSensors: 0, dataCollected: "0", errorRate: "0%", apiCalls: "0" });
    const [sensorStatuses, setSensorStatuses] = useState([]);
    const [apiStatuses, setApiStatuses] = useState([]);
    const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true); // 워크플로우 전용 로딩 상태
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const currentUser = getCurrentUserData();
    const userId = currentUser?.user_id;

    // 캘린더 이벤트 로드
    useEffect(() => {
        const loadCalendarEvents = async () => {
            try {
                setIsLoadingEvents(true);
                const responseData = await getCalendarEvents(); 
                console.log("[DashboardPage] Raw events data from backend:", JSON.stringify(responseData, null, 2));
                if (responseData && responseData.success && Array.isArray(responseData.events)) {
                    const formattedEvents = responseData.events.map((event, idx) => {
                        const parseDateTimeStringAsUTC = (dateTimeString) => {
                            if (!dateTimeString || typeof dateTimeString !== 'string') return null;
                            if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(dateTimeString)) {
                                return new Date(dateTimeString.replace(' ', 'T') + 'Z');
                            }
                            const parsedDate = new Date(dateTimeString); 
                            return isNaN(parsedDate.getTime()) ? null : parsedDate;
                        };
                        const startDate = parseDateTimeStringAsUTC(event.start);
                        const endDate = parseDateTimeStringAsUTC(event.end);
                        if (!startDate || isNaN(startDate.getTime()) || !endDate || isNaN(endDate.getTime())) {
                            console.error("!!! [DashboardPage] Invalid Date object created for calendar event:", event);
                            return null;
                        }
                        return {
                            id: event.id || `event-idx-${idx}`, title: event.title, start: startDate,
                            end: endDate, allDay: event.allDay || false, 
                            desc: event.description || event.desc || '', 
                        };
                    }).filter(event => event !== null); 
                    setEvents(formattedEvents);
                } else {
                    console.warn('[DashboardPage] Calendar data not loaded or format mismatch:', responseData);
                    setEvents([]); 
                }
            } catch (error) {
                console.error('[DashboardPage] Exception while loading calendar events:', error);
                if (error.authError) { alert('일정 로드 권한이 없습니다. 다시 로그인해주세요.'); if (navigate) navigate('/login'); }
                setEvents([]);
            } finally { setIsLoadingEvents(false); }
        };
        if (userId) { loadCalendarEvents(); } 
        else { setIsLoadingEvents(false); setEvents([]); console.log("[DashboardPage] No user_id found, skipping calendar event load."); }
    }, [userId, navigate]);

    // 대시보드 위젯 데이터 로드
    useEffect(() => {
        const fetchDashboardWidgetsData = async () => {
            try {
                const [summary, statuses, apis] = await Promise.all([
                    getDashboardSummary(), getSensorStatuses(), getApiStatusesForDashboard()
                ]);
                setSummaryData(summary); setSensorStatuses(statuses); setApiStatuses(apis);
            } catch (error) { console.error("[DashboardPage] Error fetching dashboard widgets data:", error); }
        };
        fetchDashboardWidgetsData();
    }, []);

    // ★★★ 최근 워크플로우 데이터 로드 (상세 로그 포함) ★★★
    const [recentWorkflows, setRecentWorkflows] = useState([]);
    useEffect(() => {
        const loadRecentWorkflows = async () => {
            console.log("[DashboardPage] LoadRecentWorkflows: Attempting to load..."); // 1. 함수 시작 로그
            setIsLoadingWorkflows(true); 
            try {
                const workflowsArray = await getRecentWorkflowsForDashboard(); 
                console.log("[DashboardPage] LoadRecentWorkflows: Raw response from API:", JSON.stringify(workflowsArray, null, 2)); // 2. API 원본 데이터

                if (Array.isArray(workflowsArray)) {
                    console.log("[DashboardPage] LoadRecentWorkflows: Response is an array. Count:", workflowsArray.length); // 3. 배열 확인 및 개수
                    console.log("[DashboardPage] LoadRecentWorkflows: Setting recentWorkflows state with (full array):", JSON.stringify(workflowsArray, null, 2)); // 4. 상태 설정 전 데이터
                    setRecentWorkflows(workflowsArray);
                } else {
                    console.error('[DashboardPage] LoadRecentWorkflows: Data is not an array or API call failed:', workflowsArray); // 5. 배열 아닐 시
                    setRecentWorkflows([]); 
                }
            } catch (error) {
                console.error('[DashboardPage] LoadRecentWorkflows: Exception caught:', error); // 6. 예외 발생 시
                setRecentWorkflows([]); 
            } finally {
                setIsLoadingWorkflows(false); 
                console.log("[DashboardPage] LoadRecentWorkflows: Finished. isLoadingWorkflows set to false."); // 7. 로딩 완료
            }
        };
        loadRecentWorkflows();
    }, []);

    // Socket.IO 연결
    useEffect(() => {
        socketRef.current = io(SOCKET_SERVER_URL, { transports: ['websocket'] });
        socketRef.current.on('connect_error', (err) => { console.error("Socket.IO connection error:", err.message); setIsConnected(false); });
        socketRef.current.on('connect', () => setIsConnected(true));
        socketRef.current.on('disconnect', () => setIsConnected(false));
        socketRef.current.on('newSensorData', (newData) => {
            setLiveSensorData(prevData => {
                const enrichedData = { ...newData, time: new Date(newData.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) };
                return [...prevData, enrichedData].slice(-MAX_DATA_POINTS_LINE_CHART);
            });
        });
        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, []);

    const getIconComponentForSensor = (sensorName = "") => {
        const lowerSensorName = sensorName.toLowerCase();
        if (lowerSensorName.includes("온도")) return Thermometer;
        if (lowerSensorName.includes("습도")) return Droplet;
        if (lowerSensorName.includes("전류")) return Zap;
        if (lowerSensorName.includes("압력")) return Wind;
        if (lowerSensorName.includes("가스")) return AlertTriangle;
        return Activity;
    };

    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [newEvent, setNewEvent] = useState({ title: '', start: null, end: null, desc: '' });
    // const [dateRangeFilter, setDateRangeFilter] = useState('today'); // 현재 JSX에서 사용 X

    const handleSaveEvent = async () => {
        if (!userId) { if (navigate) navigate('/login'); return; }
        if (!newEvent.title || !newEvent.start || !newEvent.end) { alert('제목, 시작 시간, 종료 시간은 필수입니다.'); return; }
        try {
            const eventDataPayload = {
                title: newEvent.title, start: newEvent.start.toISOString(), 
                end: newEvent.end.toISOString(), description: newEvent.desc,
            };
            let response;
            if (selectedEvent && selectedEvent.id) {
                response = await updateCalendarEvent(selectedEvent.id, eventDataPayload);
            } else {
                response = await createCalendarEvent(eventDataPayload);
            }
            if (response && response.success && response.event) {
                const parseDateTimeStringAsUTC = (dateTimeString) => {
                    if (!dateTimeString || typeof dateTimeString !== 'string') return null;
                    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(dateTimeString)) { return new Date(dateTimeString.replace(' ', 'T') + 'Z'); }
                    const parsedDate = new Date(dateTimeString); return isNaN(parsedDate.getTime()) ? null : parsedDate;
                };
                const processedEvent = {
                    ...response.event,
                    start: parseDateTimeStringAsUTC(response.event.start),
                    end: parseDateTimeStringAsUTC(response.event.end)
                };
                if (!processedEvent.start || !processedEvent.end) { // 파싱 실패 시 처리
                    alert('저장된 이벤트의 날짜 형식이 올바르지 않아 목록에 추가할 수 없습니다.');
                    setShowEventModal(false); setSelectedEvent(null); setNewEvent({ title: '', start: null, end: null, desc: '' });
                    return;
                }
                if (selectedEvent && selectedEvent.id) {
                    setEvents(events.map(ev => ev.id === selectedEvent.id ? processedEvent : ev));
                } else {
                    setEvents([...events, processedEvent]);
                }
                setShowEventModal(false); setSelectedEvent(null); setNewEvent({ title: '', start: null, end: null, desc: '' });
            } else { alert(response?.error || '일정 저장 실패'); }
        } catch (error) {
            console.error('[DashboardPage] Error saving event:', error);
            if (error.authError) { if (navigate) navigate('/login'); } else { alert(error.message || '일정 저장 중 오류'); }
        }
    };

    const handleDeleteEvent = async (eventIdToDelete) => {
        if (!userId) { if (navigate) navigate('/login'); return; }
        if (!eventIdToDelete || !window.confirm('삭제하시겠습니까?')) return;
        try {
            const response = await deleteCalendarEvent(eventIdToDelete);
            if (response && response.success) {
                setEvents(events.filter(event => event.id !== eventIdToDelete));
                setShowEventModal(false); setSelectedEvent(null);  
            } else { alert(response?.error || '일정 삭제 실패'); }
        } catch (error) {
            console.error('[DashboardPage] Error deleting event:', error);
            if (error.authError) { if (navigate) navigate('/login'); } else { alert(error.message || '일정 삭제 중 오류'); }
        }
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setNewEvent({ title: event.title, start: event.start, end: event.end, desc: event.desc || event.description || '' });
        setShowEventModal(true);
    };

    const handleSelectSlot = ({ start, end }) => { 
        setSelectedEvent(null); setNewEvent({ title: '', start, end, desc: '' });
        setShowEventModal(true);
    };

    return (
        <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="text-xs text-right text-gray-500 dark:text-gray-400"> 
                Socket Status: {isConnected ? 
                    <span className="text-green-500 font-semibold">Connected</span> : 
                    <span className="text-red-500 font-semibold">Disconnected</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard title="활성 센서" value={summaryData.activeSensors} change="+2" up={true} icon={<Activity size={20} className="text-blue-500" />} />
                <SummaryCard title="수집 데이터 (오늘)" value={summaryData.dataCollected} change="+12%" up={true} icon={<Database size={20} className="text-green-500" />} />
                <SummaryCard title="오류율" value={summaryData.errorRate} change="-0.6%" up={false} icon={<Shield size={20} className="text-red-500" />} />
                <SummaryCard title="API 호출 (오늘)" value={summaryData.apiCalls} change="+5%" up={true} icon={<Globe size={20} className="text-purple-500" />} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">실시간 데이터 스트림</h3>
                    <div className="h-[350px] md:h-[400px]">
                        {liveSensorData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                 <LineChart data={liveSensorData}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} className="dark:stroke-gray-600 stroke-gray-300" />
                                    <XAxis dataKey="time" tick={{fontSize: 11, fill: '#6b7280'}} className="dark:fill-gray-400" />
                                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tick={{fontSize: 11, fill: '#6b7280'}} className="dark:fill-gray-400" />
                                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tick={{fontSize: 11, fill: '#6b7280'}} className="dark:fill-gray-400" />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', fontSize: '12px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ color: '#333' }}
                                    />
                                    <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                                    <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 5 }} name="온도 (°C)" dot={false} />
                                    <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#82ca9d" strokeWidth={2} activeDot={{ r: 5 }} name="습도 (%)" dot={false} />
                                    {liveSensorData[0]?.pressure !== undefined && 
                                        <Line yAxisId="left" type="monotone" dataKey="pressure" stroke="#ffc658" strokeWidth={2} activeDot={{ r: 5 }} name="압력 (hPa)" dot={false} />
                                    }
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full bg-gray-100 dark:bg-gray-700/30 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400 dark:text-gray-500 italic">실시간 센서 데이터 수신 대기 중...</span>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">디바이스 상태</h3>
                            <Link to="/iot-devices" className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline">전체 보기</Link>
                        </div>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                            {sensorStatuses.length > 0 ? sensorStatuses.map((sensor, idx) => (
                                <SensorStatusItem 
                                  key={sensor.id || `sensor-${idx}`}
                                  name={sensor.name}
                                  status={sensor.status}
                                  value={sensor.value}
                                  IconComponent={getIconComponentForSensor(sensor.name)}
                                />
                            )) : (
                                <div className="text-xs text-gray-500 dark:text-gray-400 py-3 text-center bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                    등록된 디바이스가 없습니다
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">일정 관리</h3>
                        <div className="h-[280px] md:h-[300px] text-sm">
                            {isLoadingEvents ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                                </div>
                            ) : (
                                <Calendar
                                    localizer={localizer}
                                    events={events}
                                    startAccessor="start"
                                    endAccessor="end"
                                    style={{ height: '100%' }}
                                    onSelectSlot={handleSelectSlot}
                                    onSelectEvent={handleSelectEvent}
                                    selectable
                                    views={['month', 'week', 'day']}
                                    messages={{
                                        next: "다음", previous: "이전", today: "오늘",
                                        month: "월", week: "주", day: "일", agenda: "일정 목록",
                                        date: "날짜", time: "시간", event: "일정 내용",
                                        noEventsInRange: "해당 범위에 일정이 없습니다.",
                                    }}
                                    className="rbc-calendar dark:text-gray-300"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* ★★★ 최근 워크플로우 섹션 (상세 로그 포함) ★★★ */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">최근 워크플로우</h3>
                    <Link to="/workflow" className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline">
                        전체 보기 및 새로 만들기
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 7. isLoadingWorkflows 상태 확인 로그 (JSX용) */}
                    {isLoadingWorkflows && console.log("[DashboardPage] Rendering Workflows JSX: isLoadingWorkflows is TRUE")}
                    {!isLoadingWorkflows && recentWorkflows.length > 0 && console.log("[DashboardPage] Rendering Workflows JSX: Found workflows, count:", recentWorkflows.length)}
                    {!isLoadingWorkflows && recentWorkflows.length === 0 && console.log("[DashboardPage] Rendering Workflows JSX: No workflows to display (length is 0, not loading).")}

                    {isLoadingWorkflows ? ( 
                         <div className="col-span-full flex justify-center py-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        </div>
                    ) : recentWorkflows.length > 0 ? (
                        recentWorkflows.slice(0, 3).map((workflow, idx) => {
                            // 8. map 함수 내부에서 각 workflow 객체 확인 로그
                            console.log(`[DashboardPage] Rendering Workflows JSX: Mapping workflow item ${idx}:`, JSON.stringify(workflow, null, 2));
                            return (
                                <WorkflowItem
                                    key={workflow.id || workflow.workflow_id || `workflow-${idx}`}
                                    name={workflow.name}
                                    time={workflow.updated_at ? new Date(workflow.updated_at).toLocaleDateString() : 'N/A'}
                                />
                            );
                        })
                    ) : (
                        <div className="col-span-full text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                            최근 워크플로우가 없습니다.
                        </div>
                    )}
                </div>
            </div>

            {/* 이벤트 모달 */}
            {showEventModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                     <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 md:p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-5">
                            {selectedEvent ? '일정 수정' : '새 일정 추가'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">제목</label>
                                <input id="eventTitle" type="text" value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="eventStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">시작 시간</label>
                                    <input id="eventStart" type="datetime-local" 
                                        value={newEvent.start ? format(newEvent.start, "yyyy-MM-dd'T'HH:mm") : ''}
                                        onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value ? new Date(e.target.value) : null })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="eventEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">종료 시간</label>
                                    <input id="eventEnd" type="datetime-local" 
                                        value={newEvent.end ? format(newEvent.end, "yyyy-MM-dd'T'HH:mm") : ''}
                                        onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value ? new Date(e.target.value) : null })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="eventDesc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">설명</label>
                                <textarea id="eventDesc" value={newEvent.desc}
                                    onChange={(e) => setNewEvent({ ...newEvent, desc: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-purple-500 focus:border-purple-500"
                                    rows="3"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            {selectedEvent && (
                                <button onClick={() => handleDeleteEvent(selectedEvent.id)}
                                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-700/30 rounded-lg transition-colors"
                                >삭제</button>
                            )}
                            <button onClick={() => { setShowEventModal(false); setSelectedEvent(null); setNewEvent({ title: '', start: null, end: null, desc: '' });}}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >취소</button>
                            <button onClick={handleSaveEvent}
                                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 rounded-lg transition-colors"
                            >저장</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DashboardPage;