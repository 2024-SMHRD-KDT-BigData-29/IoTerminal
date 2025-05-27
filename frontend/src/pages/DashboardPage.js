// File: frontend/src/pages/DashboardPage.js

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import io from 'socket.io-client';
import { 
    Activity, Database, Shield, Globe, Thermometer, Droplet, Zap, Wind, AlertTriangle, Cloud
} from 'lucide-react'; // ChevronRight는 JSX에서 사용되지 않아 일단 제거
import { getDashboardSummary, getSensorStatuses, getRecentWorkflowsForDashboard, getApiStatusesForDashboard } from '../services/dashboardService';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ko';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/Calendar.css';
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../services/calendarService';
import { getCurrentUserData } from '../services/authService';
import { getWorkflowList } from '../api/workflow';
import { getUserDevices } from '../services/deviceService';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';

moment.locale('ko');
const localizer = momentLocalizer(moment);

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
const MAX_DATA_POINTS_LINE_CHART = 20;
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const SummaryCard = ({ title, value, change, up, icon }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center">
                {icon && <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-lg mr-4">{icon}</div>}
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
                    {change && (
                        <p className={`text-xs font-medium ${up ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{change}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const SensorStatusItem = ({ name, description, status, icon: Icon }) => (
    <div className="bg-white dark:bg-[#3a2e5a] p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-[#9575cd] flex items-center justify-center">
                    <Icon className="h-5 w-5 text-violet-600 dark:text-violet-200" />
                </div>
                <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
                </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
                status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
                {status === 'active' ? '활성' : '비활성'}
            </span>
        </div>
    </div>
);

const WorkflowItem = ({ name, status, lastRun }) => (
    <div className="bg-white dark:bg-[#3a2e5a] p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    마지막 실행: {lastRun}
                </p>
            </div>
            <div className="text-right">
                <span className={`px-2 py-1 text-xs rounded-full ${
                    status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    status === 'paused' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                    {status === 'active' ? '실행 중' : status === 'paused' ? '일시 중지' : '중지됨'}
                </span>
            </div>
        </div>
    </div>
);

// WeatherCard 컴포넌트 (SummaryCard와 어울리는 디자인)
const WeatherCard = () => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [locationError, setLocationError] = useState(null);

    useEffect(() => {
        const getWeather = async (latitude, longitude) => {
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/weather/current?lat=${latitude}&lon=${longitude}`
                );
                const result = await response.json();
                if (!result.success) throw new Error(result.message || '날씨 정보를 가져오는데 실패했습니다.');
                setWeather(result.data);
            } catch (error) {
                setLocationError(error.message);
            } finally {
                setLoading(false);
            }
        };
        if (!navigator.geolocation) {
            setLocationError('위치 정보 사용 불가');
            setLoading(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                getWeather(latitude, longitude);
            },
            () => {
                setLocationError('위치 권한이 필요합니다.');
                setLoading(false);
            }
        );
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center h-full min-h-[60px]">날씨 정보를 불러오는 중...</div>;
    }
    if (locationError) {
        return <div className="text-red-500 text-sm h-full min-h-[60px] flex items-center justify-center">{locationError}</div>;
    }
    if (!weather) {
        return <div className="text-gray-400 text-sm h-full min-h-[60px] flex items-center justify-center">날씨 정보가 없습니다</div>;
    }
    return (
        <div className="flex items-center justify-between h-full min-h-[60px]">
            <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">{Math.round(weather.temperature)}°C</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{weather.city}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{weather.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">습도: {weather.humidity}%</p>
            </div>
            <div className="flex flex-col items-center">
                <img
                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                    alt={weather.description}
                    className="w-12 h-12"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">풍속: {weather.windSpeed} m/s</p>
            </div>
        </div>
    );
};

function DashboardPage() {
    const [liveSensorData, setLiveSensorData] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    const [summaryData, setSummaryData] = useState({ activeSensors: 0, dataCollected: "0", errorRate: "0%", apiCalls: "0" });
    const [sensorStatuses, setSensorStatuses] = useState([]);
    const [isLoadingSensors, setIsLoadingSensors] = useState(true);
    const [apiStatuses, setApiStatuses] = useState([]);
    const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true);
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const currentUser = getCurrentUserData();
    const userId = currentUser?.user_id;

    const [latestSensorValues, setLatestSensorValues] = useState([]);

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
                            id: event.id || `event-idx-${idx}`, 
                            title: event.title, 
                            start: startDate,
                            end: endDate, 
                            allDay: event.allDay || false, 
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
                if (error.authError) {
                    alert(error.message || '일정 로드 권한이 없습니다. 다시 로그인해주세요.');
                    if (navigate) navigate('/login');
                } else {
                    alert(error.message || '일정 로드 중 오류가 발생했습니다.');
                    setEvents([]);
                }
            } finally {
                setIsLoadingEvents(false);
            }
        };
        
        if (userId) {
            loadCalendarEvents();
        } else {
            setIsLoadingEvents(false);
            setEvents([]);
            console.log("[DashboardPage] No user_id found, skipping calendar event load.");
        }
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
            setIsLoadingWorkflows(true);
            try {
                const response = await getWorkflowList();
                if (response && response.success && Array.isArray(response.workflows)) {
                    // 최근 3개의 워크플로우만 필터링
                    const sortedWorkflows = response.workflows
                        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                        .slice(0, 3);
                    setRecentWorkflows(sortedWorkflows);
                } else {
                    setRecentWorkflows([]);
                }
            } catch (error) {
                console.error('최근 워크플로우 로드 실패:', error);
                setRecentWorkflows([]);
            } finally {
                setIsLoadingWorkflows(false);
            }
        };
        if (userId) {
            loadRecentWorkflows();
        }
    }, [userId]);

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

    // 센서별 최신값 로드
    useEffect(() => {
        axios.get('/api/sensors/latest-values')
            .then(res => setLatestSensorValues(res.data.sensors || []))
            .catch(err => console.error('[DashboardPage] 센서별 최신값 로드 실패:', err));
    }, []);

    // 시각화용 데이터 가공
    const gasSensors = latestSensorValues.filter(s => s.name.includes('메탄') || s.name.includes('황화수소') || s.name.includes('암모니아'));
    const otherSensors = latestSensorValues.filter(s => !gasSensors.includes(s));

    const barData = {
        labels: gasSensors.map(s => s.name),
        datasets: [
            {
                label: '최신 측정값',
                data: gasSensors.map(s => s.latestValue),
                backgroundColor: [
                    'rgba(123, 104, 238, 0.7)',
                    'rgba(255, 193, 7, 0.7)',
                    'rgba(76, 175, 80, 0.7)'
                ]
            }
        ]
    };

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

    // 디바이스 상태 로드
    useEffect(() => {
        const loadDeviceStatuses = async () => {
            try {
                setIsLoadingSensors(true);
                const devices = await getUserDevices();
                // 최대 3개의 디바이스만 표시
                const recentDevices = devices.slice(0, 3);
                setSensorStatuses(recentDevices.map(device => ({
                    id: device.device_id,
                    name: device.name,
                    description: device.description,
                    status: (device.status?.online === true || device.status?.online === 1 || device.status?.online === 'true') ? 'active' : 'inactive'
                })));
            } catch (error) {
                console.error('디바이스 상태 로드 실패:', error);
                setSensorStatuses([]);
            } finally {
                setIsLoadingSensors(false);
            }
        };

        loadDeviceStatuses();
    }, []);

    return (
        <div className="p-3 md:p-4 space-y-3 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* 상단 요약 카드 섹션 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard title="활성 센서" value={summaryData.activeSensors} change="+2" up={true} icon={<Activity size={20} className="text-blue-500" />} />
                <SummaryCard title="수집 데이터 (오늘)" value={summaryData.dataCollected} change="+12%" up={true} icon={<Database size={20} className="text-green-500" />} />
                <SummaryCard title="오류율" value={summaryData.errorRate} change="-0.6%" up={false} icon={<Shield size={20} className="text-red-500" />} />
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col justify-between">
                    <WeatherCard />
                </div>
            </div>
            
            {/* 메인 콘텐츠 섹션 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* 실시간 데이터 스트림 */}
                <div className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-xl shadow p-3 flex flex-col">
                    <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-2">실시간 데이터 스트림</h3>
                    <div className="flex-1 min-h-[160px]">
                        {liveSensorData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={liveSensorData}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} className="dark:stroke-gray-600 stroke-gray-300" />
                                    <XAxis dataKey="time" tick={{fontSize: 10, fill: '#6b7280'}} className="dark:fill-gray-400" />
                                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tick={{fontSize: 10, fill: '#6b7280'}} className="dark:fill-gray-400" />
                                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tick={{fontSize: 10, fill: '#6b7280'}} className="dark:fill-gray-400" />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', fontSize: '11px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ color: '#333' }}
                                    />
                                    <Legend wrapperStyle={{fontSize: '11px', paddingTop: '6px'}} />
                                    <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 4 }} name="온도 (°C)" dot={false} />
                                    <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#82ca9d" strokeWidth={2} activeDot={{ r: 4 }} name="습도 (%)" dot={false} />
                                    {liveSensorData[0]?.pressure !== undefined && 
                                        <Line yAxisId="left" type="monotone" dataKey="pressure" stroke="#ffc658" strokeWidth={2} activeDot={{ r: 4 }} name="압력 (hPa)" dot={false} />
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

                {/* 우측 사이드바 */}
                <div className="lg:col-span-5 space-y-3 flex flex-col">
                    {/* 디바이스 상태 */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 flex-1 min-h-[80px]">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">디바이스 상태</h3>
                            <Link to="/iot/devices" className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline">전체 보기</Link>
                        </div>
                        <div className="space-y-2">
                            {isLoadingSensors ? (
                                <div className="flex justify-center items-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                                </div>
                            ) : sensorStatuses.length > 0 ? (
                                sensorStatuses.map((sensor) => (
                                    <SensorStatusItem 
                                        key={sensor.id}
                                        name={sensor.name}
                                        description={sensor.description}
                                        status={sensor.status}
                                        icon={getIconComponentForSensor(sensor.name)}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                                    등록된 디바이스가 없습니다
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 일정 관리 */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">일정 관리</h3>
                        <div className="text-sm">
                            {isLoadingEvents ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                                </div>
                            ) : (
                                <div style={{ height: 360 }}>
                                    <Calendar
                                        localizer={localizer}
                                        events={events}
                                        startAccessor="start"
                                        endAccessor="end"
                                        onSelectSlot={handleSelectSlot}
                                        onSelectEvent={handleSelectEvent}
                                        selectable
                                        views={['month', 'week', 'day']}
                                        defaultView="month"
                                        onNavigate={(date, view, action) => {
                                            console.log('Calendar navigation:', { date, view, action });
                                        }}
                                        messages={{
                                            next: "다음", previous: "이전", today: "오늘",
                                            month: "월", week: "주", day: "일",
                                            agenda: "일정 목록",
                                            date: "날짜", time: "시간", event: "일정 내용",
                                            noEventsInRange: "해당 범위에 일정이 없습니다.",
                                        }}
                                        className="rbc-calendar dark:text-gray-300"
                                        style={{
                                            height: '100%',
                                            width: '100%',
                                            backgroundColor: 'transparent'
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 최근 워크플로우 섹션 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 mt-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">최근 워크플로우</h3>
                    <Link to="/workflow" className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline">
                        전체 보기 및 새로 만들기
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {isLoadingWorkflows ? ( 
                        <div className="col-span-full flex justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                        </div>
                    ) : recentWorkflows && recentWorkflows.length > 0 ? (
                        recentWorkflows.map((workflow, idx) => (
                            <Link
                                key={workflow.workflow_id || workflow.id || idx}
                                to={`/workflow/edit/${workflow.workflow_id || workflow.id}`}
                                style={{ textDecoration: 'none' }}
                            >
                                <WorkflowItem
                                    name={workflow.name}
                                    status={workflow.status || 'active'}
                                    lastRun={workflow.updated_at ? new Date(workflow.updated_at).toLocaleString() : '실행 기록 없음'}
                                />
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-4 text-xs text-gray-500 dark:text-gray-400">
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
                                        value={newEvent.start ? moment(newEvent.start).format('YYYY-MM-DDTHH:mm') : ''}
                                        onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value ? new Date(e.target.value) : null })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="eventEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">종료 시간</label>
                                    <input id="eventEnd" type="datetime-local" 
                                        value={newEvent.end ? moment(newEvent.end).format('YYYY-MM-DDTHH:mm') : ''}
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