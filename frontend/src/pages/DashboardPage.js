// File: frontend/src/pages/DashboardPage.js

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import io from 'socket.io-client';
import { 
    Activity, Database, Shield, Globe, Thermometer, Droplet, Zap, Wind, AlertTriangle, Cloud, ChevronLeft, ChevronRight, Plus
} from 'lucide-react';
import { getDashboardSummary, getSensorStatuses, getRecentWorkflowsForDashboard, getApiStatusesForDashboard } from '../services/dashboardService';
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../services/calendarService';
import { getCurrentUserData } from '../services/authService';
import { getWorkflowList } from '../api/workflow';
import { getUserDevices } from '../services/deviceService';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
const MAX_DATA_POINTS_LINE_CHART = 20;
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const SummaryCard = ({ title, value, icon }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center">
                {icon && <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-lg mr-4">{icon}</div>}
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
                </div>
            </div>
        </div>
    );
};

const SensorStatusItem = ({ name, description, status, icon: Icon }) => (
    <div className="bg-white dark:bg-[#3a2e5a] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    status === 'active' 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                    <Icon className={`h-6 w-6 ${
                        status === 'active' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-gray-500 dark:text-gray-400'
                    }`} />
                </div>
                <div className="ml-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                    {status === 'active' ? '온라인' : '오프라인'}
                </span>
                <div className={`w-2 h-2 rounded-full mt-2 ${
                    status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
            </div>
        </div>
    </div>
);

const WorkflowItem = ({ name, status, lastRun }) => (
    <div className="bg-white dark:bg-[#3a2e5a] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200 cursor-pointer">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    status === 'active' 
                        ? 'bg-purple-100 dark:bg-purple-900/30' 
                        : status === 'paused' 
                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                        : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                    <Activity className={`h-5 w-5 ${
                        status === 'active' 
                            ? 'text-purple-600 dark:text-purple-400' 
                            : status === 'paused'
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-gray-500 dark:text-gray-400'
                    }`} />
                </div>
                <div className="ml-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        마지막 실행: {lastRun}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : status === 'paused' 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
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

// 간단한 캘린더 컴포넌트
const SimpleCalendar = ({ events, onDateClick, onEventClick, onAddEvent }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 월의 첫 번째 날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 달력 시작일 (이전 달의 마지막 주 포함)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // 달력 종료일 (다음 달의 첫 주 포함)
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    // 달력에 표시할 날짜들 생성
    const calendarDays = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
        calendarDays.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    
    // 주 단위로 그룹화
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
    }
    
    // 특정 날짜의 이벤트 가져오기
    const getEventsForDate = (date) => {
        return events.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate.toDateString() === date.toDateString();
        });
    };
    
    // 날짜가 현재 월인지 확인
    const isCurrentMonth = (date) => date.getMonth() === month;
    
    // 오늘 날짜인지 확인
    const isToday = (date) => date.toDateString() === today.toDateString();
    
    // 이전/다음 달로 이동
    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
    };
    
    // 오늘로 이동
    const goToToday = () => {
        setCurrentDate(new Date());
    };
    
    const monthNames = [
        '1월', '2월', '3월', '4월', '5월', '6월',
        '7월', '8월', '9월', '10월', '11월', '12월'
    ];
    
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    
    return (
        <div className="h-full flex flex-col">
            {/* 캘린더 헤더 */}
            <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => navigateMonth(-1)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                        <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1 text-sm bg-purple-100 hover:bg-purple-200 dark:bg-purple-800 dark:hover:bg-purple-700 text-purple-700 dark:text-purple-200 rounded transition-colors"
                    >
                        오늘
                    </button>
                    <button
                        onClick={() => navigateMonth(1)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                        <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {year}년 {monthNames[month]}
                </h3>
                
                <button
                    onClick={onAddEvent}
                    className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                >
                    <Plus size={16} />
                    <span className="text-sm">일정 추가</span>
                </button>
            </div>
            
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day, index) => (
                    <div
                        key={day}
                        className={`text-center text-sm font-medium py-2 ${
                            index === 0 ? 'text-red-600 dark:text-red-400' : 
                            index === 6 ? 'text-blue-600 dark:text-blue-400' : 
                            'text-gray-700 dark:text-gray-300'
                        }`}
                    >
                        {day}
                    </div>
                ))}
            </div>
            
            {/* 캘린더 그리드 */}
            <div className="flex-1 grid grid-rows-6 gap-1">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-1">
                        {week.map((date, dayIndex) => {
                            const dayEvents = getEventsForDate(date);
                            const isCurrentMonthDay = isCurrentMonth(date);
                            const isTodayDay = isToday(date);
                            
                            return (
                                <div
                                    key={date.toISOString()}
                                    onClick={() => onDateClick(date)}
                                    className={`
                                        relative p-1 min-h-[60px] border border-gray-200 dark:border-gray-600 rounded cursor-pointer
                                        transition-colors hover:bg-gray-50 dark:hover:bg-gray-700
                                        ${!isCurrentMonthDay ? 'bg-gray-50 dark:bg-gray-800 opacity-50' : 'bg-white dark:bg-gray-800'}
                                        ${isTodayDay ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}
                                    `}
                                >
                                    <div className={`
                                        text-sm font-medium mb-1
                                        ${!isCurrentMonthDay ? 'text-gray-400 dark:text-gray-500' : 
                                          isTodayDay ? 'text-purple-700 dark:text-purple-300' :
                                          dayIndex === 0 ? 'text-red-600 dark:text-red-400' :
                                          dayIndex === 6 ? 'text-blue-600 dark:text-blue-400' :
                                          'text-gray-700 dark:text-gray-300'}
                                    `}>
                                        {date.getDate()}
                                    </div>
                                    
                                    {/* 이벤트 표시 */}
                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 2).map((event, eventIndex) => (
                                            <div
                                                key={event.id || eventIndex}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEventClick(event);
                                                }}
                                                className="text-xs bg-purple-600 text-white px-1 py-0.5 rounded truncate hover:bg-purple-700 transition-colors"
                                                title={event.title}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                +{dayEvents.length - 2} 더보기
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

function DashboardPage() {
    const [liveSensorData, setLiveSensorData] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);
    const [previousValues, setPreviousValues] = useState({}); // 이전 값 저장용
    const [totalDataCount, setTotalDataCount] = useState(0); // 총 수집 데이터 카운터 추가

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
        socketRef.current.on('connect', () => {
            console.log('Socket.IO 연결됨');
            setIsConnected(true);
        });
        socketRef.current.on('disconnect', () => {
            console.log('Socket.IO 연결 해제됨');
            setIsConnected(false);
        });
        socketRef.current.on('newSensorData', (newData) => {
            console.log('새로운 센서 데이터 수신:', newData);
            
            // 총 데이터 카운터 증가
            setTotalDataCount(prev => prev + 1);
            
            setLiveSensorData(prevData => {
                const enrichedData = { 
                    ...newData, 
                    time: new Date(newData.time).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit', 
                        hour12: false 
                    }),
                    // 가스 센서 데이터만 매핑
                    methane: newData.mq4 || 0,
                    hydrogen_sulfide: newData.mq136 || 0,
                    ammonia: newData.mq137 || 0
                };
                
                // 이전 값 저장 (변화 표시용)
                if (prevData.length > 0) {
                    const lastData = prevData[prevData.length - 1];
                    setPreviousValues({
                        methane: lastData.methane,
                        hydrogen_sulfide: lastData.hydrogen_sulfide,
                        ammonia: lastData.ammonia
                    });
                }
                
                return [...prevData, enrichedData].slice(-MAX_DATA_POINTS_LINE_CHART);
            });
        });
        return () => { 
            if (socketRef.current) {
                console.log('Socket.IO 연결 정리');
                socketRef.current.disconnect(); 
            }
        };
    }, []);

    // 센서별 최신값 로드
    useEffect(() => {
        axios.get('/api/sensors/latest-values')
            .then(res => setLatestSensorValues(res.data.sensors || []))
            .catch(err => console.error('[DashboardPage] 센서별 최신값 로드 실패:', err));
    }, []);

    // 실시간 데이터를 기반으로 요약 정보 업데이트
    useEffect(() => {
        if (liveSensorData.length > 0) {
            // 가스 센서만 카운트 (온도, 습도 제외)
            const activeSensorCount = 3; // 메탄, 황화수소, 암모니아
            
            setSummaryData(prev => ({
                ...prev,
                activeSensors: activeSensorCount,
                dataCollected: totalDataCount.toString()
            }));
        }
    }, [liveSensorData, totalDataCount]);

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
        if (!newEvent.title || !newEvent.start || !newEvent.end) { 
            alert('제목, 시작 시간, 종료 시간은 필수입니다.'); 
            return; 
        }
        
        // 종료 시간이 시작 시간보다 이전인지 확인
        if (newEvent.end <= newEvent.start) {
            alert('종료 시간은 시작 시간보다 늦어야 합니다.');
            return;
        }
        
        try {
            const eventDataPayload = {
                title: newEvent.title, 
                start: newEvent.start.toISOString(), 
                end: newEvent.end.toISOString(), 
                description: newEvent.desc,
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
                    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(dateTimeString)) { 
                        return new Date(dateTimeString.replace(' ', 'T') + 'Z'); 
                    }
                    const parsedDate = new Date(dateTimeString); 
                    return isNaN(parsedDate.getTime()) ? null : parsedDate;
                };
                const processedEvent = {
                    ...response.event,
                    start: parseDateTimeStringAsUTC(response.event.start),
                    end: parseDateTimeStringAsUTC(response.event.end)
                };
                if (!processedEvent.start || !processedEvent.end) { 
                    alert('저장된 이벤트의 날짜 형식이 올바르지 않아 목록에 추가할 수 없습니다.');
                    setShowEventModal(false); 
                    setSelectedEvent(null); 
                    setNewEvent({ title: '', start: null, end: null, desc: '' });
                    return;
                }
                if (selectedEvent && selectedEvent.id) {
                    setEvents(events.map(ev => ev.id === selectedEvent.id ? processedEvent : ev));
                } else {
                    setEvents([...events, processedEvent]);
                }
                setShowEventModal(false); 
                setSelectedEvent(null); 
                setNewEvent({ title: '', start: null, end: null, desc: '' });
            } else { 
                alert(response?.error || '일정 저장 실패'); 
            }
        } catch (error) {
            console.error('[DashboardPage] Error saving event:', error);
            if (error.authError) { 
                if (navigate) navigate('/login'); 
            } else { 
                alert(error.message || '일정 저장 중 오류'); 
            }
        }
    };

    const handleDeleteEvent = async (eventIdToDelete) => {
        if (!userId) { if (navigate) navigate('/login'); return; }
        if (!eventIdToDelete || !window.confirm('이 일정을 삭제하시겠습니까?')) return;
        try {
            const response = await deleteCalendarEvent(eventIdToDelete);
            if (response && response.success) {
                setEvents(events.filter(event => event.id !== eventIdToDelete));
                setShowEventModal(false); 
                setSelectedEvent(null);  
            } else { 
                alert(response?.error || '일정 삭제 실패'); 
            }
        } catch (error) {
            console.error('[DashboardPage] Error deleting event:', error);
            if (error.authError) { 
                if (navigate) navigate('/login'); 
            } else { 
                alert(error.message || '일정 삭제 중 오류'); 
            }
        }
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setNewEvent({ 
            title: event.title, 
            start: event.start, 
            end: event.end, 
            desc: event.desc || event.description || '' 
        });
        setShowEventModal(true);
    };

    const handleSelectSlot = (selectedDate) => { 
        // 선택된 날짜에 기본 1시간 이벤트로 설정
        const startTime = new Date(selectedDate);
        startTime.setHours(9, 0, 0, 0); // 오전 9시로 설정
        
        const endTime = new Date(startTime);
        endTime.setHours(10, 0, 0, 0); // 오전 10시로 설정
        
        setSelectedEvent(null); 
        setNewEvent({
            title: '',
            start: startTime, 
            end: endTime, 
            desc: ''
        });
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
        <div className="p-2 md:p-3 space-y-3 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* 상단 요약 카드 섹션 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryCard title="활성 센서" value={summaryData.activeSensors} icon={<Activity size={20} className="text-blue-500" />} />
                <SummaryCard title="수집 데이터 (실시간)" value={summaryData.dataCollected} icon={<Database size={20} className="text-green-500" />} />
                <SummaryCard title="오류율" value={summaryData.errorRate} icon={<Shield size={20} className="text-red-500" />} />
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col justify-between">
                    <WeatherCard />
                </div>
            </div>
            
            {/* 메인 콘텐츠 섹션 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* 실시간 데이터 스트림 */}
                <div className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-xl shadow p-3 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">실시간 데이터 스트림</h3>
                        <div className="flex items-center space-x-3">
                            {/* 이벤트 상태 표시 */}
                            {liveSensorData.length > 0 && liveSensorData[liveSensorData.length - 1]?.eventActive && (
                                <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs font-medium text-red-700 dark:text-red-300">이벤트 감지</span>
                                </div>
                            )}
                            {/* 연결 상태 */}
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {isConnected ? '연결됨' : '연결 끊김'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 h-64 md:h-72 lg:h-80">
                        {liveSensorData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={liveSensorData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} className="dark:stroke-gray-600 stroke-gray-300" />
                                    <XAxis 
                                        dataKey="time" 
                                        tick={{fontSize: 10, fill: '#6b7280'}} 
                                        className="dark:fill-gray-400"
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis 
                                        yAxisId="left" 
                                        orientation="left" 
                                        stroke="#8884d8" 
                                        tick={{fontSize: 10, fill: '#6b7280'}} 
                                        className="dark:fill-gray-400"
                                        domain={['dataMin - 2', 'dataMax + 2']}
                                        label={{ value: 'ppm', angle: -90, position: 'insideLeft' }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(255,255,255,0.95)', 
                                            fontSize: '12px', 
                                            borderRadius: '8px', 
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            border: '1px solid #e5e7eb'
                                        }}
                                        itemStyle={{ color: '#333', fontWeight: 'bold' }}
                                        formatter={(value, name) => [
                                            `${typeof value === 'number' ? value.toFixed(1) : value} ppm`,
                                            name
                                        ]}
                                        labelFormatter={(label) => {
                                            const dataPoint = liveSensorData.find(d => d.time === label);
                                            return `${label}${dataPoint?.eventActive ? ' 🚨 이벤트 중' : ''}`;
                                        }}
                                    />
                                    <Legend wrapperStyle={{fontSize: '12px', paddingTop: '8px'}} />
                                    
                                    {/* 가스 센서 데이터만 표시 */}
                                    <Line 
                                        yAxisId="left" 
                                        type="monotone" 
                                        dataKey="methane" 
                                        stroke="#ff6b6b" 
                                        strokeWidth={2} 
                                        activeDot={{ r: 4, stroke: '#ff6b6b', strokeWidth: 2, fill: '#fff' }} 
                                        name="메탄 가스 (MQ4)" 
                                        dot={false}
                                        connectNulls={false}
                                        animationDuration={300}
                                    />
                                    <Line 
                                        yAxisId="left" 
                                        type="monotone" 
                                        dataKey="hydrogen_sulfide" 
                                        stroke="#ffa726" 
                                        strokeWidth={2} 
                                        activeDot={{ r: 4, stroke: '#ffa726', strokeWidth: 2, fill: '#fff' }} 
                                        name="황화수소 (MQ136)" 
                                        dot={false}
                                        connectNulls={false}
                                        animationDuration={300}
                                    />
                                    <Line 
                                        yAxisId="left" 
                                        type="monotone" 
                                        dataKey="ammonia" 
                                        stroke="#66bb6a" 
                                        strokeWidth={2} 
                                        activeDot={{ r: 4, stroke: '#66bb6a', strokeWidth: 2, fill: '#fff' }} 
                                        name="암모니아 (MQ137)" 
                                        dot={false}
                                        connectNulls={false}
                                        animationDuration={300}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full bg-gray-100 dark:bg-gray-700/30 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <div className="animate-pulse mb-2">
                                        <div className="w-8 h-8 bg-purple-500 rounded-full mx-auto"></div>
                                    </div>
                                    <span className="text-gray-400 dark:text-gray-500 italic">실시간 센서 데이터 수신 대기 중...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 우측 사이드바 */}
                <div className="lg:col-span-5 space-y-4 flex flex-col">
                    {/* 디바이스 상태 */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex-1 min-h-[200px] max-h-[280px] overflow-y-auto">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">디바이스 상태</h3>
                            <Link to="/iot/devices" className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline">전체 보기</Link>
                        </div>
                        <div className="space-y-3">
                            {isLoadingSensors ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
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
                                <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                                    등록된 디바이스가 없습니다
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 일정 관리 */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex-1 min-h-[450px]">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">일정 관리</h3>
                        <div className="text-sm">
                            {isLoadingEvents ? (
                                <div className="h-full flex items-center justify-center min-h-[350px]">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                                </div>
                            ) : (
                                <div style={{ height: 400 }}>
                                    <SimpleCalendar
                                        events={events}
                                        onDateClick={handleSelectSlot}
                                        onEventClick={handleSelectEvent}
                                        onAddEvent={() => {
                                            setShowEventModal(true);
                                            setNewEvent({ title: '', start: null, end: null, desc: '' });
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 최근 워크플로우 섹션 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 mt-4 max-h-[200px]">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">최근 워크플로우</h3>
                    <Link to="/workflow" className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline">
                        전체 보기
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 overflow-y-auto max-h-[140px]">
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
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                                {selectedEvent ? '일정 수정' : '새 일정 추가'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowEventModal(false);
                                    setSelectedEvent(null);
                                    setNewEvent({ title: '', start: null, end: null, desc: '' });
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    일정 제목 <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    id="eventTitle" 
                                    type="text" 
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder="일정 제목을 입력하세요"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="eventStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        시작 시간 <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        id="eventStart" 
                                        type="datetime-local" 
                                        value={newEvent.start ? newEvent.start.toISOString().slice(0, 16) : ''}
                                        onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value ? new Date(e.target.value) : null })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="eventEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        종료 시간 <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        id="eventEnd" 
                                        type="datetime-local" 
                                        value={newEvent.end ? newEvent.end.toISOString().slice(0, 16) : ''}
                                        onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value ? new Date(e.target.value) : null })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label htmlFor="eventDesc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    설명
                                </label>
                                <textarea 
                                    id="eventDesc" 
                                    value={newEvent.desc}
                                    onChange={(e) => setNewEvent({ ...newEvent, desc: e.target.value })}
                                    placeholder="일정에 대한 설명을 입력하세요 (선택사항)"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                                    rows="3"
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div>
                                {selectedEvent && (
                                    <button 
                                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                                        className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center space-x-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        <span>삭제</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center space-x-3">
                                <button 
                                    onClick={() => {
                                        setShowEventModal(false);
                                        setSelectedEvent(null);
                                        setNewEvent({ title: '', start: null, end: null, desc: '' });
                                    }}
                                    className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    취소
                                </button>
                                <button 
                                    onClick={handleSaveEvent}
                                    className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 rounded-lg transition-colors flex items-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>{selectedEvent ? '수정' : '저장'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DashboardPage;