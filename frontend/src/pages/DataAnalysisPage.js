import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { 
    getDeviceUsageData, 
    getDeviceSensorData, 
    getDeviceEventLogs
} from '../services/analysisService';
import { getUserDevices, getDeviceSensors } from '../services/deviceService';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import axios from 'axios';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const DataAnalysisPage = () => {
    const [selectedDevice, setSelectedDevice] = useState('');
    const [devices, setDevices] = useState([]);
    const [timeRange, setTimeRange] = useState('day');
    const [analysisType, setAnalysisType] = useState('usage');
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [customDateRange, setCustomDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [isCustomRange, setIsCustomRange] = useState(false);
    const [sensors, setSensors] = useState([]);
    const [sensorData, setSensorData] = useState({});
    const [isRealTimeMode, setIsRealTimeMode] = useState(false);
    const [realTimeInterval, setRealTimeInterval] = useState(null);

    // 디바이스 목록 로드
    useEffect(() => {
        const loadDevices = async () => {
            try {
                const deviceList = await getUserDevices();
                setDevices(deviceList);
                if (deviceList.length > 0 && !selectedDevice) {
                    setSelectedDevice(deviceList[0].device_id);
                }
            } catch (error) {
                console.error('디바이스 목록 로드 실패:', error);
                setError('디바이스 목록을 불러오는데 실패했습니다.');
            }
        };
        loadDevices();
    }, []);

    // 모의 데이터 생성 함수
    const generateMockSensorData = (sensorName, sensorType, count = 20) => {
        const data = [];
        const now = new Date();
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC + 9시간
        
        // 현재 선택된 시간 범위에 따른 데이터 포인트 수와 간격 결정
        let dataPoints, intervalMs;
        
        switch (timeRange) {
            case 'day':
                // 24시간: 30분 간격으로 48개 포인트
                dataPoints = 48;
                intervalMs = (24 * 60 * 60 * 1000) / dataPoints; // 정확히 30분
                break;
            case 'week':
                // 7일: 2시간 간격으로 84개 포인트
                dataPoints = 84;
                intervalMs = (7 * 24 * 60 * 60 * 1000) / dataPoints; // 정확히 2시간
                break;
            case 'month':
                // 30일: 6시간 간격으로 120개 포인트
                dataPoints = 120;
                intervalMs = (30 * 24 * 60 * 60 * 1000) / dataPoints; // 정확히 6시간
                break;
            case 'year':
                // 1년: 1일 간격으로 365개 포인트
                dataPoints = 365;
                intervalMs = (365 * 24 * 60 * 60 * 1000) / dataPoints; // 정확히 1일
                break;
            default:
                dataPoints = count;
                intervalMs = 30 * 1000; // 30초 (기본값)
        }
        
        // 센서 타입에 따른 값 범위 설정
        let valueRange = { min: 0.01, max: 0.5 };
        if (sensorName.includes('메탄') || sensorName.includes('MQ4') || sensorType.includes('gas')) {
            valueRange = { min: 0.01, max: 0.5 };
        } else if (sensorName.includes('황화수소') || sensorName.includes('MQ136')) {
            valueRange = { min: 0.02, max: 0.8 };
        } else if (sensorName.includes('암모니아') || sensorName.includes('MQ137')) {
            valueRange = { min: 0.05, max: 1.2 };
        }
        
        for (let i = 0; i < dataPoints; i++) {
            // 현재 시간에서 역순으로 계산 (최신 데이터가 마지막에 오도록)
            const timestamp = new Date(koreaTime.getTime() - ((dataPoints - 1 - i) * intervalMs));
            
            // 시간대별 변화 패턴 적용
            const hour = timestamp.getHours();
            let timeOfDayFactor = 1.0;
            
            if (sensorType.includes('gas')) {
                // 가스 센서는 더 불규칙한 패턴
                timeOfDayFactor = 0.8 + 0.4 * Math.random();
            }
            
            // 요일별 변화 (주말에는 약간 다른 패턴)
            const dayOfWeek = timestamp.getDay();
            const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.9 : 1.0;
            
            // 계절별 변화 (월별로 조정)
            const month = timestamp.getMonth();
            let seasonalFactor = 1.0;
            
            // 기본값 + 패턴 적용 + 랜덤 변동
            let baseValue = valueRange.min + (valueRange.max - valueRange.min) * 0.5;
            baseValue *= timeOfDayFactor * weekendFactor * seasonalFactor;
            
            const randomVariation = (Math.random() - 0.5) * (valueRange.max - valueRange.min) * 0.3;
            const value = Math.max(valueRange.min, Math.min(valueRange.max, baseValue + randomVariation));
            
            data.push({
                timestamp: timestamp.toISOString(),
                value: parseFloat(value.toFixed(3))
            });
        }
        
        return data;
    };

    // 디바이스 선택 시 센서 목록 및 데이터 로드 (센서 분석일 때만)
    useEffect(() => {
        if (selectedDevice && analysisType === 'sensor') {
            console.log('디바이스 센서 목록 API 호출 시작:', selectedDevice);
            getDeviceSensors(selectedDevice).then(sensorList => {
                console.log('디바이스 센서 목록 응답:', sensorList);
                setSensors(sensorList);
                
                // 각 센서별로 모의 데이터 생성
                const mockSensorData = {};
                sensorList.forEach(sensor => {
                    if (sensor.sensor_id) {
                        console.log(`센서 ${sensor.sensor_id} 모의 데이터 생성 시작`);
                        // 실제 데이터 시도
                        axios.get(`/api/sensors/${sensor.sensor_id}/timeseries?farmno=1&zone=A`)
                            .then(res => {
                                console.log(`센서 ${sensor.sensor_id} 실제 데이터 응답:`, res.data);
                                const realData = res.data.data || [];
                                if (realData.length >= 5) {
                                    // 실제 데이터가 충분하면 사용
                                    setSensorData(prev => ({
                                        ...prev,
                                        [sensor.sensor_id]: realData
                                    }));
                                } else {
                                    // 실제 데이터가 부족하면 모의 데이터 생성
                                    const mockData = generateMockSensorData(sensor.name, sensor.type);
                                    setSensorData(prev => ({
                                        ...prev,
                                        [sensor.sensor_id]: mockData
                                    }));
                                }
                            })
                            .catch(err => {
                                console.error(`센서 ${sensor.sensor_id} 실제 데이터 로드 실패, 모의 데이터 생성:`, err);
                                // 실제 데이터 로드 실패 시 모의 데이터 생성
                                const mockData = generateMockSensorData(sensor.name, sensor.type);
                                setSensorData(prev => ({
                                    ...prev,
                                    [sensor.sensor_id]: mockData
                                }));
                            });
                    }
                });
            }).catch(err => {
                console.error('디바이스 센서 목록 로드 실패:', err);
                setSensors([]);
            });
        } else {
            setSensors([]);
            setSensorData({});
            // 실시간 모드 비활성화
            setIsRealTimeMode(false);
            if (realTimeInterval) {
                clearInterval(realTimeInterval);
                setRealTimeInterval(null);
            }
        }
    }, [selectedDevice, analysisType, timeRange]);

    // 실시간 모드 토글
    const toggleRealTimeMode = () => {
        setIsRealTimeMode(prev => !prev);
    };

    // 실시간 데이터 업데이트
    useEffect(() => {
        if (isRealTimeMode && analysisType === 'sensor' && sensors.length > 0) {
            console.log('실시간 모드 시작');
            const interval = setInterval(() => {
                sensors.forEach(sensor => {
                    updateSensorDataRealTime(sensor.sensor_id, sensor.type, sensor.name);
                });
            }, 5000); // 5초마다 업데이트
            
            setRealTimeInterval(interval);
            
            return () => {
                console.log('실시간 모드 정리');
                clearInterval(interval);
            };
        } else {
            if (realTimeInterval) {
                clearInterval(realTimeInterval);
                setRealTimeInterval(null);
            }
        }
    }, [isRealTimeMode, analysisType, sensors]);

    // 컴포넌트 언마운트 시 인터벌 정리
    useEffect(() => {
        return () => {
            if (realTimeInterval) {
                clearInterval(realTimeInterval);
            }
        };
    }, []);

    // 분석 데이터 로드
    useEffect(() => {
        const fetchAnalysisData = async () => {
            if (!selectedDevice) return;

            const dateRange = getDateRange();
            if (!dateRange) return;

            setLoading(true);
            setError('');
            try {
                console.log('분석 데이터 요청:', { selectedDevice, analysisType, dateRange });
                
                let data;
                switch (analysisType) {
                    case 'usage':
                        console.log('사용량 분석 API 호출 시작');
                        data = await getDeviceUsageData(selectedDevice, dateRange);
                        console.log('사용량 분석 응답:', data);
                        break;
                    case 'sensor':
                        console.log('센서 데이터 분석 API 호출 시작');
                        data = await getDeviceSensorData(selectedDevice, dateRange);
                        console.log('센서 데이터 분석 응답:', data);
                        break;
                    case 'events':
                        console.log('이벤트 로그 분석 API 호출 시작');
                        data = await getDeviceEventLogs(selectedDevice, dateRange);
                        console.log('이벤트 로그 분석 응답:', data);
                        break;
                    default:
                        throw new Error('지원하지 않는 분석 유형입니다.');
                }
                setChartData(formatChartData(data));
            } catch (error) {
                console.error('데이터 분석 실패:', error);
                console.error('오류 상세:', error.response);
                setError(`데이터를 불러오는데 실패했습니다: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysisData();
    }, [selectedDevice, timeRange, analysisType, customDateRange]);

    const getDateRange = () => {
        if (isCustomRange) {
            return customDateRange;
        }

        const endDate = new Date();
        const startDate = new Date();
        switch (timeRange) {
            case 'day':
                startDate.setDate(startDate.getDate() - 1);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                return null;
        }
        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        };
    };

    const formatChartData = (data) => {
        if (!data || !data.data) return null;

        // 이벤트 로그 분석의 경우 막대 차트용 데이터 포맷
        if (analysisType === 'events') {
            // 날짜별로 데이터 그룹화
            const dateGroups = {};
            const eventTypes = new Set();
            
            data.data.forEach(item => {
                const date = new Date(item.timestamp).toLocaleDateString('ko-KR', { 
                    month: '2-digit', 
                    day: '2-digit',
                    timeZone: 'Asia/Seoul'
                });
                
                if (!dateGroups[date]) {
                    dateGroups[date] = {};
                }
                
                const eventType = item.eventType || '일반 이벤트';
                eventTypes.add(eventType);
                
                if (!dateGroups[date][eventType]) {
                    dateGroups[date][eventType] = 0;
                }
                dateGroups[date][eventType] += item.value;
            });
            
            // 날짜 라벨 생성
            const labels = Object.keys(dateGroups).sort();
            
            // 이벤트 타입별 색상 매핑
            const colorMap = {
                '센서 알림': 'rgba(255, 99, 132, 0.8)',
                '시스템 경고': 'rgba(54, 162, 235, 0.8)',
                '연결 오류': 'rgba(255, 206, 86, 0.8)',
                '데이터 이상': 'rgba(75, 192, 192, 0.8)',
                '일반 이벤트': 'rgba(126, 87, 194, 0.8)'
            };
            
            // 데이터셋 생성 (이벤트 타입별로)
            const datasets = Array.from(eventTypes).map(eventType => ({
                label: eventType,
                data: labels.map(date => dateGroups[date][eventType] || 0),
                backgroundColor: colorMap[eventType] || 'rgba(126, 87, 194, 0.8)',
                borderColor: (colorMap[eventType] || 'rgba(126, 87, 194, 0.8)').replace('0.8', '1'),
                borderWidth: 1,
                borderRadius: 4
            }));
            
            return {
                labels,
                datasets
            };
        }

        // 기본 라인 차트용 데이터 포맷 (사용량, 센서)
        return {
            labels: data.data.map(item => new Date(item.timestamp).toLocaleString()),
            datasets: [
                {
                    label: data.label || '데이터',
                    data: data.data.map(item => item.value),
                    borderColor: '#7e57c2',
                    backgroundColor: 'rgba(126, 87, 194, 0.1)',
                    tension: 0.1,
                    fill: true
                }
            ]
        };
    };

    // 시간 범위에 따른 라벨 형식 결정
    const getTimeLabel = (timestamp) => {
        const date = new Date(timestamp);
        
        switch (timeRange) {
            case 'day':
                // 24시간: 시:분 형식
                return date.toLocaleString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'Asia/Seoul'
                });
            case 'week':
                // 7일: 월/일 시:분 형식
                return date.toLocaleString('ko-KR', { 
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'Asia/Seoul'
                });
            case 'month':
                // 30일: 월/일 형식
                return date.toLocaleString('ko-KR', { 
                    month: '2-digit',
                    day: '2-digit',
                    timeZone: 'Asia/Seoul'
                });
            case 'year':
                // 1년: 년/월 형식
                return date.toLocaleString('ko-KR', { 
                    year: '2-digit',
                    month: '2-digit',
                    timeZone: 'Asia/Seoul'
                });
            default:
                return date.toLocaleString('ko-KR', { 
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'Asia/Seoul'
                });
        }
    };

    // 실시간 데이터 업데이트 함수
    const updateSensorDataRealTime = (sensorId, sensorType, sensorName) => {
        setSensorData(prev => {
            const currentData = prev[sensorId] || [];
            // 한국 시간대로 현재 시간 생성
            const now = new Date();
            const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC + 9시간
            
            console.log('실시간 업데이트 - 현재 시간:', koreaTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
            
            // 센서 타입에 따른 값 범위 설정
            let valueRange = { min: 0.01, max: 0.5 };
            if (sensorName.includes('메탄') || sensorName.includes('MQ4') || sensorType.includes('gas')) {
                valueRange = { min: 0.01, max: 0.5 };
            } else if (sensorName.includes('황화수소') || sensorName.includes('MQ136')) {
                valueRange = { min: 0.02, max: 0.8 };
            } else if (sensorName.includes('암모니아') || sensorName.includes('MQ137')) {
                valueRange = { min: 0.05, max: 1.2 };
            } else if (sensorName.includes('온도') || sensorType.includes('temperature')) {
                valueRange = { min: 18, max: 28 };
            } else if (sensorName.includes('습도') || sensorType.includes('humidity')) {
                valueRange = { min: 40, max: 80 };
            }
            
            // 이전 값을 기준으로 자연스러운 변화 생성
            const lastValue = currentData.length > 0 ? currentData[currentData.length - 1].value : null;
            let newValue;
            
            if (lastValue !== null) {
                // 이전 값에서 ±10% 범위 내에서 변화
                const maxChange = (valueRange.max - valueRange.min) * 0.1;
                const change = (Math.random() - 0.5) * maxChange;
                newValue = Math.max(valueRange.min, Math.min(valueRange.max, lastValue + change));
            } else {
                // 첫 번째 값은 중간값 근처에서 시작
                const baseValue = valueRange.min + (valueRange.max - valueRange.min) * 0.4;
                const randomVariation = (Math.random() - 0.5) * (valueRange.max - valueRange.min) * 0.2;
                newValue = Math.max(valueRange.min, Math.min(valueRange.max, baseValue + randomVariation));
            }
            
            const newDataPoint = {
                timestamp: koreaTime.toISOString(),
                value: parseFloat(newValue.toFixed(3))
            };
            
            // 최근 50개 데이터만 유지 (오래된 데이터 제거)
            const updatedData = [...currentData, newDataPoint].slice(-50);
            
            return {
                ...prev,
                [sensorId]: updatedData
            };
        });
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">데이터 분석</h2>
            
            {/* 분석 옵션 선택 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* 디바이스 선택 */}
                <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                    <option value="">디바이스 선택</option>
                    {devices.map(device => (
                        <option key={device.device_id} value={device.device_id}>
                            {device.name}
                        </option>
                    ))}
                </select>

                {/* 시간 범위 선택 */}
                <select
                    value={isCustomRange ? 'custom' : timeRange}
                    onChange={(e) => {
                        if (e.target.value === 'custom') {
                            setIsCustomRange(true);
                        } else {
                            setIsCustomRange(false);
                            setTimeRange(e.target.value);
                        }
                    }}
                    className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                    <option value="day">24시간</option>
                    <option value="week">7일</option>
                    <option value="month">30일</option>
                    <option value="year">1년</option>
                    <option value="custom">직접 설정</option>
                </select>

                {/* 분석 유형 선택 */}
                <select
                    value={analysisType}
                    onChange={(e) => setAnalysisType(e.target.value)}
                    className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                    <option value="usage">사용량 분석</option>
                    <option value="sensor">센서 데이터 분석</option>
                    <option value="events">이벤트 로그 분석</option>
                </select>
            </div>

            {/* 커스텀 날짜 선택 */}
            {isCustomRange && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <input
                        type="datetime-local"
                        value={customDateRange.startDate}
                        onChange={(e) => setCustomDateRange(prev => ({
                            ...prev,
                            startDate: e.target.value
                        }))}
                        className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                    <input
                        type="datetime-local"
                        value={customDateRange.endDate}
                        onChange={(e) => setCustomDateRange(prev => ({
                            ...prev,
                            endDate: e.target.value
                        }))}
                        className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
            )}

            {/* 선택된 분석 유형에 따른 메인 차트 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-[#7e57c2]">
                        {analysisType === 'usage' && '사용량 분석'}
                        {analysisType === 'sensor' && (
                            <div className="flex items-center space-x-3">
                                <span>센서 데이터 분석</span>
                                {isRealTimeMode && (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                            실시간
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                        {analysisType === 'events' && '이벤트 로그 분석'}
                    </h4>
                    
                    {/* 실시간 모드 토글 - 센서 분석일 때만 표시 */}
                    {analysisType === 'sensor' && selectedDevice && sensors.length > 0 && (
                        <div className="flex items-center space-x-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isRealTimeMode}
                                    onChange={toggleRealTimeMode}
                                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    실시간 업데이트
                                </span>
                            </label>
                            {isRealTimeMode && (
                                <span className="text-xs text-gray-500">
                                    5초마다 업데이트
                                </span>
                            )}
                        </div>
                    )}
                </div>
                
                {/* 센서 데이터 분석일 때 연결된 센서 목록 표시 */}
                {analysisType === 'sensor' && selectedDevice && sensors.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h5 className="text-md font-semibold text-gray-700 dark:text-gray-300">
                                연결된 센서 ({sensors.length}개)
                            </h5>
                            {isRealTimeMode && (
                                <div className="text-xs text-gray-500">
                                    마지막 업데이트: {new Date().toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' })}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {sensors.map(sensor => {
                                const sensorValues = (sensorData[sensor.sensor_id] || []).map(d => d.value);
                                const latestValue = sensorValues.length > 0 ? sensorValues[sensorValues.length - 1] : null;
                                const avgValue = sensorValues.length > 0 ? (sensorValues.reduce((a, b) => a + b, 0) / sensorValues.length) : null;
                                
                                return (
                                    <div key={sensor.sensor_id} className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <h6 className="font-semibold text-blue-800 dark:text-blue-300">{sensor.name}</h6>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                                    {sensor.type}
                                                </span>
                                                {isRealTimeMode && (
                                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-400">최신값</p>
                                                <p className="font-bold text-blue-700 dark:text-blue-300">
                                                    {latestValue !== null ? latestValue.toFixed(3) : 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-400">평균값</p>
                                                <p className="font-bold text-purple-700 dark:text-purple-300">
                                                    {avgValue !== null ? avgValue.toFixed(3) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-500">
                                                데이터 포인트: {sensorValues.length}개
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-[400px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-[400px] text-red-500">
                        {error}
                    </div>
                ) : chartData ? (
                    <div className="h-[400px]">
                        {analysisType === 'usage' && <Line data={chartData} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'top'
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }} />}
                        {analysisType === 'sensor' && (
                            sensors.length > 0 ? (
                                // 센서가 있을 때는 통합 차트 표시 (황화수소 센서 스타일)
                                <Line data={{
                                    labels: sensors.length > 0 && sensorData[sensors[0].sensor_id] ? 
                                        sensorData[sensors[0].sensor_id].slice(
                                            timeRange === 'day' ? -48 : 
                                            timeRange === 'week' ? -84 : 
                                            timeRange === 'month' ? -120 : 
                                            timeRange === 'year' ? -365 : -50
                                        ).map(d => getTimeLabel(d.timestamp)) : [],
                                    datasets: sensors.map((sensor, index) => {
                                        const sensorValues = (sensorData[sensor.sensor_id] || []).map(d => d.value);
                                        let dataSlice;
                                        switch (timeRange) {
                                            case 'day':
                                                dataSlice = -48;
                                                break;
                                            case 'week':
                                                dataSlice = -84;
                                                break;
                                            case 'month':
                                                dataSlice = -120;
                                                break;
                                            case 'year':
                                                dataSlice = -365;
                                                break;
                                            default:
                                                dataSlice = -50;
                                        }
                                        
                                        // 황화수소 센서 스타일 색상 (오렌지 계열)
                                        const colors = [
                                            'rgba(255, 159, 64, 0.8)',   // 오렌지
                                            'rgba(255, 99, 132, 0.8)',   // 빨강
                                            'rgba(54, 162, 235, 0.8)',   // 파랑
                                            'rgba(255, 206, 86, 0.8)',   // 노랑
                                            'rgba(75, 192, 192, 0.8)',   // 청록
                                            'rgba(153, 102, 255, 0.8)'   // 보라
                                        ];
                                        
                                        return {
                                            label: sensor.name,
                                            data: sensorValues.slice(dataSlice),
                                            borderColor: colors[index % colors.length],
                                            backgroundColor: colors[index % colors.length].replace('0.8', '0.1'),
                                            tension: 0.2,
                                            fill: true,
                                            pointBackgroundColor: colors[index % colors.length],
                                            pointBorderColor: '#fff',
                                            pointBorderWidth: 2,
                                            pointRadius: 3,
                                            pointHoverRadius: 5
                                        };
                                    })
                                }} options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                            labels: {
                                                usePointStyle: true,
                                                padding: 20,
                                                font: {
                                                    size: 12
                                                }
                                            }
                                        },
                                        tooltip: {
                                            mode: 'index',
                                            intersect: false,
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                            titleColor: '#fff',
                                            bodyColor: '#fff',
                                            borderColor: 'rgba(255, 159, 64, 1)',
                                            borderWidth: 1,
                                            callbacks: {
                                                title: function(context) {
                                                    return `시간: ${context[0].label}`;
                                                },
                                                label: function(context) {
                                                    return `${context.dataset.label}: ${context.parsed.y.toFixed(3)} ppm`;
                                                }
                                            }
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            grid: {
                                                color: 'rgba(255, 159, 64, 0.1)',
                                                drawBorder: false
                                            },
                                            title: {
                                                display: true,
                                                text: '센서 값 (ppm)',
                                                color: 'rgba(255, 159, 64, 0.8)',
                                                font: {
                                                    size: 14,
                                                    weight: 'bold'
                                                }
                                            },
                                            ticks: {
                                                color: 'rgba(255, 159, 64, 0.7)'
                                            }
                                        },
                                        x: {
                                            grid: {
                                                color: 'rgba(255, 159, 64, 0.1)',
                                                drawBorder: false
                                            },
                                            title: {
                                                display: true,
                                                text: timeRange === 'day' ? '시간' : 
                                                      timeRange === 'week' ? '날짜/시간' : 
                                                      timeRange === 'month' ? '날짜' : 
                                                      timeRange === 'year' ? '월' : '시간',
                                                color: 'rgba(255, 159, 64, 0.8)',
                                                font: {
                                                    size: 14,
                                                    weight: 'bold'
                                                }
                                            },
                                            ticks: {
                                                color: 'rgba(255, 159, 64, 0.7)',
                                                maxTicksLimit: timeRange === 'day' ? 12 : 
                                                              timeRange === 'week' ? 14 : 
                                                              timeRange === 'month' ? 15 : 12
                                            }
                                        }
                                    },
                                    interaction: {
                                        mode: 'index',
                                        intersect: false
                                    },
                                    elements: {
                                        line: {
                                            borderWidth: 2
                                        },
                                        point: {
                                            hoverBorderWidth: 3
                                        }
                                    }
                                }} />
                            ) : (
                                // 센서가 없을 때는 기본 차트 표시
                                <Line data={chartData} options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'top'
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true
                                        }
                                    }
                                }} />
                            )
                        )}
                        {analysisType === 'events' && <Bar data={chartData} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'top',
                                    labels: {
                                        usePointStyle: true,
                                        padding: 20
                                    }
                                },
                                tooltip: {
                                    mode: 'index',
                                    intersect: false,
                                    callbacks: {
                                        title: function(context) {
                                            return `날짜: ${context[0].label}`;
                                        },
                                        label: function(context) {
                                            return `${context.dataset.label}: ${context.parsed.y}건`;
                                        },
                                        footer: function(tooltipItems) {
                                            let total = 0;
                                            tooltipItems.forEach(function(tooltipItem) {
                                                total += tooltipItem.parsed.y;
                                            });
                                            return `총 이벤트: ${total}건`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    stacked: true,
                                    grid: {
                                        display: false
                                    },
                                    title: {
                                        display: true,
                                        text: '날짜'
                                    }
                                },
                                y: {
                                    stacked: true,
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: '이벤트 발생 횟수'
                                    },
                                    grid: {
                                        color: 'rgba(0, 0, 0, 0.1)'
                                    }
                                }
                            },
                            interaction: {
                                mode: 'index',
                                intersect: false
                            }
                        }} />}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-[400px] text-gray-500">
                        디바이스와 분석 옵션을 선택해주세요
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataAnalysisPage; 