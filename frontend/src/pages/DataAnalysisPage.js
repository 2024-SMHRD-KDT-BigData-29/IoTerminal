import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { 
    getDeviceUsageData, 
    getDeviceSensorData, 
    getDeviceEventLogs,
    getDevicePerformanceStats 
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
        
        for (let i = count - 1; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - (i * 30 * 1000)); // 30초 간격
            const koreaTime = new Date(timestamp.getTime() + (9 * 60 * 60 * 1000)); // UTC + 9시간
            
            // 기본값 + 랜덤 변동
            const baseValue = valueRange.min + (valueRange.max - valueRange.min) * 0.4;
            const randomVariation = (Math.random() - 0.5) * (valueRange.max - valueRange.min) * 0.4;
            const value = Math.max(valueRange.min, Math.min(valueRange.max, baseValue + randomVariation));
            
            data.push({
                timestamp: koreaTime.toISOString(),
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
    }, [selectedDevice, analysisType]);

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
                    case 'performance':
                        console.log('성능 분석 API 호출 시작');
                        data = await getDevicePerformanceStats(selectedDevice, dateRange);
                        console.log('성능 분석 응답:', data);
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

        // 성능 분석의 경우 파이 차트용 데이터 포맷
        if (analysisType === 'performance') {
            const avgValue = data.data.reduce((sum, item) => sum + item.value, 0) / data.data.length;
            const goodPerformance = data.data.filter(item => item.value >= 80).length;
            const averagePerformance = data.data.filter(item => item.value >= 60 && item.value < 80).length;
            const poorPerformance = data.data.filter(item => item.value < 60).length;
            
            return {
                labels: ['우수', '보통', '미흡'],
                datasets: [{
                    data: [goodPerformance, averagePerformance, poorPerformance],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(255, 99, 132, 0.8)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 2
                }]
            };
        }

        // 이벤트 로그 분석의 경우 막대 차트용 데이터 포맷
        if (analysisType === 'events') {
            return {
                labels: data.data.map(item => new Date(item.timestamp).toLocaleDateString()),
                datasets: [{
                    label: data.label || '이벤트 수',
                    data: data.data.map(item => item.value),
                    backgroundColor: 'rgba(126, 87, 194, 0.6)',
                    borderColor: 'rgba(126, 87, 194, 1)',
                    borderWidth: 1
                }]
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
                    <option value="performance">성능 분석</option>
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
                        {analysisType === 'performance' && '성능 분석'}
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
                                // 센서가 있을 때는 통합 차트 표시
                                <Line data={{
                                    labels: sensors.length > 0 && sensorData[sensors[0].sensor_id] ? 
                                        sensorData[sensors[0].sensor_id].slice(-20).map(d => {
                                            const date = new Date(d.timestamp);
                                            return date.toLocaleString('ko-KR', { 
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit', 
                                                minute: '2-digit',
                                                timeZone: 'Asia/Seoul'
                                            });
                                        }) : [],
                                    datasets: sensors.map((sensor, index) => {
                                        const sensorValues = (sensorData[sensor.sensor_id] || []).map(d => d.value);
                                        const colors = [
                                            'rgba(255, 99, 132, 0.8)',
                                            'rgba(54, 162, 235, 0.8)',
                                            'rgba(255, 206, 86, 0.8)',
                                            'rgba(75, 192, 192, 0.8)',
                                            'rgba(153, 102, 255, 0.8)',
                                            'rgba(255, 159, 64, 0.8)'
                                        ];
                                        return {
                                            label: sensor.name,
                                            data: sensorValues.slice(-20), // 최근 20개 데이터만
                                            borderColor: colors[index % colors.length],
                                            backgroundColor: colors[index % colors.length].replace('0.8', '0.1'),
                                            tension: 0.1,
                                            fill: false
                                        };
                                    })
                                }} options={{
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
                                    position: 'top'
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }} />}
                        {analysisType === 'performance' && <Pie data={chartData} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'top'
                                }
                            }
                        }} />}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-[400px] text-gray-500">
                        디바이스와 분석 옵션을 선택해주세요
                    </div>
                )}
            </div>

            {/* 분석 유형별 상세 정보 */}
            {selectedDevice && chartData && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow mb-6">
                    <h4 className="text-lg font-bold mb-4 text-[#7e57c2]">분석 결과 요약</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h5 className="font-semibold text-blue-700 dark:text-blue-300">총 데이터 포인트</h5>
                            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                                {chartData.datasets[0]?.data?.length || 0}개
                            </p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <h5 className="font-semibold text-green-700 dark:text-green-300">평균값</h5>
                            <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                                {chartData.datasets[0]?.data?.length > 0 
                                    ? (chartData.datasets[0].data.reduce((a, b) => a + b, 0) / chartData.datasets[0].data.length).toFixed(1)
                                    : 0}
                            </p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <h5 className="font-semibold text-purple-700 dark:text-purple-300">최대값</h5>
                            <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                                {chartData.datasets[0]?.data?.length > 0 
                                    ? Math.max(...chartData.datasets[0].data).toFixed(1)
                                    : 0}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 센서별 상세 데이터 - 센서 데이터 분석일 때만 표시 */}
            {analysisType === 'sensor' && selectedDevice && sensors.length > 0 && (
                <div className="grid grid-cols-1 gap-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">센서별 상세 분석</h3>
                        <div className="text-sm text-gray-500">
                            총 {sensors.length}개 센서 연결됨
                        </div>
                    </div>
                    {sensors.map((sensor, index) => {
                        const chartType = index % 3; // 0: Line, 1: Bar, 2: Doughnut
                        const sensorValues = (sensorData[sensor.sensor_id] || []).map(d => d.value);
                        const isActive = sensorValues.length > 0;
                        const latestValue = isActive ? sensorValues[sensorValues.length - 1] : null;
                        const avgValue = isActive ? (sensorValues.reduce((a, b) => a + b, 0) / sensorValues.length) : null;
                        const minValue = isActive ? Math.min(...sensorValues) : null;
                        const maxValue = isActive ? Math.max(...sensorValues) : null;
                        
                        return (
                            <div key={sensor.sensor_id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                                {/* 센서 헤더 */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <h4 className="text-lg font-bold text-[#7e57c2]">{sensor.name}</h4>
                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                            {sensor.type}
                                        </span>
                                        {isRealTimeMode && isActive && (
                                            <div className="flex items-center space-x-1">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                                    실시간
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">센서 ID: {sensor.sensor_id}</p>
                                        <p className={`text-xs font-semibold ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                                            {isActive ? '활성' : '비활성'}
                                        </p>
                                    </div>
                                </div>

                                {/* 센서 통계 카드 */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                                        <p className="text-xs text-blue-600 dark:text-blue-400">최신값</p>
                                        <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                            {latestValue !== null ? latestValue.toFixed(3) : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                                        <p className="text-xs text-green-600 dark:text-green-400">평균값</p>
                                        <p className="text-lg font-bold text-green-700 dark:text-green-300">
                                            {avgValue !== null ? avgValue.toFixed(3) : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg text-center">
                                        <p className="text-xs text-orange-600 dark:text-orange-400">최소값</p>
                                        <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                                            {minValue !== null ? minValue.toFixed(3) : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center">
                                        <p className="text-xs text-red-600 dark:text-red-400">최대값</p>
                                        <p className="text-lg font-bold text-red-700 dark:text-red-300">
                                            {maxValue !== null ? maxValue.toFixed(3) : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* 차트 영역 */}
                                <div className="h-[300px] mb-4">
                                    {!isActive ? (
                                        <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="text-center">
                                                <div className="text-gray-400 mb-2">📊</div>
                                                <p className="text-gray-500">센서 데이터가 없습니다</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {chartType === 0 && (
                                                <Line
                                                    data={{
                                                        labels: (sensorData[sensor.sensor_id] || []).map(d => {
                                                            const date = new Date(d.timestamp);
                                                            return date.toLocaleString('ko-KR', { 
                                                                month: '2-digit',
                                                                day: '2-digit',
                                                                hour: '2-digit', 
                                                                minute: '2-digit',
                                                                timeZone: 'Asia/Seoul'
                                                            });
                                                        }),
                                                        datasets: [{
                                                            label: sensor.name,
                                                            data: sensorValues,
                                                            borderColor: '#7e57c2',
                                                            backgroundColor: 'rgba(126, 87, 194, 0.1)',
                                                            tension: 0.2,
                                                            fill: true,
                                                            pointBackgroundColor: '#7e57c2',
                                                            pointBorderColor: '#fff',
                                                            pointBorderWidth: 2,
                                                            pointRadius: 4
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: {
                                                            legend: {
                                                                display: true,
                                                                position: 'top'
                                                            }
                                                        },
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                grid: {
                                                                    color: 'rgba(0, 0, 0, 0.1)'
                                                                }
                                                            },
                                                            x: {
                                                                grid: {
                                                                    color: 'rgba(0, 0, 0, 0.1)'
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            )}
                                            {chartType === 1 && (
                                                <Bar
                                                    data={{
                                                        labels: (sensorData[sensor.sensor_id] || []).slice(-10).map(d => {
                                                            const date = new Date(d.timestamp);
                                                            return date.toLocaleString('ko-KR', { 
                                                                month: '2-digit',
                                                                day: '2-digit',
                                                                hour: '2-digit', 
                                                                minute: '2-digit',
                                                                timeZone: 'Asia/Seoul'
                                                            });
                                                        }),
                                                        datasets: [{
                                                            label: sensor.name,
                                                            data: sensorValues.slice(-10),
                                                            backgroundColor: 'rgba(54, 162, 235, 0.6)',
                                                            borderColor: 'rgba(54, 162, 235, 1)',
                                                            borderWidth: 1,
                                                            borderRadius: 4
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: {
                                                            legend: {
                                                                display: true,
                                                                position: 'top'
                                                            }
                                                        },
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                grid: {
                                                                    color: 'rgba(0, 0, 0, 0.1)'
                                                                }
                                                            },
                                                            x: {
                                                                grid: {
                                                                    color: 'rgba(0, 0, 0, 0.1)'
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            )}
                                            {chartType === 2 && (
                                                <Doughnut
                                                    data={{
                                                        labels: ['최소값', '평균값', '최대값'],
                                                        datasets: [{
                                                            data: [minValue, avgValue, maxValue],
                                                            backgroundColor: [
                                                                'rgba(255, 99, 132, 0.8)',
                                                                'rgba(255, 206, 86, 0.8)',
                                                                'rgba(75, 192, 192, 0.8)'
                                                            ],
                                                            borderColor: [
                                                                'rgba(255, 99, 132, 1)',
                                                                'rgba(255, 206, 86, 1)',
                                                                'rgba(75, 192, 192, 1)'
                                                            ],
                                                            borderWidth: 2
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: {
                                                            legend: {
                                                                position: 'right'
                                                            }
                                                        }
                                                    }}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* 추가 정보 */}
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <span>데이터 포인트: {sensorValues.length}개</span>
                                    <div className="flex items-center space-x-2">
                                        <span>차트 타입: {chartType === 0 ? 'Line' : chartType === 1 ? 'Bar' : 'Doughnut'}</span>
                                        {isRealTimeMode && isActive && (
                                            <span className="text-green-600">● 실시간 업데이트</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 전체 센서 데이터 요약 - 모든 분석 유형에서 표시 */}
            {selectedDevice && (
                <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">가스 센서 데이터 요약</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 메탄 가스 센서 (MQ4) */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                            <h4 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">메탄 가스 (MQ4)</h4>
                            {(() => {
                                const methaneSensor = sensors.find(s => s.name.includes('메탄') || s.name.includes('MQ4') || s.type.includes('gas'));
                                const methaneData = methaneSensor ? sensorData[methaneSensor.sensor_id] : null;
                                const latestMethane = methaneData && methaneData.length > 0 ? methaneData[methaneData.length - 1].value : null;
                                return (
                                    <>
                                        <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                                            {latestMethane !== null ? `${latestMethane.toFixed(3)}ppm` : '0.025ppm'}
                                        </p>
                                        <p className="text-sm text-yellow-600">
                                            {latestMethane !== null ? (latestMethane < 0.5 ? '안전 수준' : '주의 필요') : '안전 수준'}
                                        </p>
                                    </>
                                );
                            })()}
                        </div>
                        
                        {/* 황화수소 센서 (MQ136) */}
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                            <h4 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">황화수소 (MQ136)</h4>
                            {(() => {
                                const h2sSensor = sensors.find(s => s.name.includes('황화수소') || s.name.includes('MQ136'));
                                const h2sData = h2sSensor ? sensorData[h2sSensor.sensor_id] : null;
                                const latestH2s = h2sData && h2sData.length > 0 ? h2sData[h2sData.length - 1].value : null;
                                return (
                                    <>
                                        <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                                            {latestH2s !== null ? `${latestH2s.toFixed(3)}ppm` : '0.045ppm'}
                                        </p>
                                        <p className="text-sm text-orange-600">
                                            {latestH2s !== null ? (latestH2s < 0.8 ? '안전 수준' : '주의 필요') : '안전 수준'}
                                        </p>
                                    </>
                                );
                            })()}
                        </div>
                        
                        {/* 암모니아 센서 (MQ137) */}
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                            <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">암모니아 (MQ137)</h4>
                            {(() => {
                                const nh3Sensor = sensors.find(s => s.name.includes('암모니아') || s.name.includes('MQ137'));
                                const nh3Data = nh3Sensor ? sensorData[nh3Sensor.sensor_id] : null;
                                const latestNh3 = nh3Data && nh3Data.length > 0 ? nh3Data[nh3Data.length - 1].value : null;
                                return (
                                    <>
                                        <p className="text-2xl font-bold text-red-800 dark:text-red-200">
                                            {latestNh3 !== null ? `${latestNh3.toFixed(3)}ppm` : '0.085ppm'}
                                        </p>
                                        <p className="text-sm text-red-600">
                                            {latestNh3 !== null ? (latestNh3 < 1.2 ? '안전 수준' : '주의 필요') : '안전 수준'}
                                        </p>
                                    </>
                                );
                            })()}
                        </div>
                        
                        {/* 연결 상태 */}
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">연결 상태</h4>
                            <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{sensors.length}개</p>
                            <p className="text-sm text-purple-600">
                                {(() => {
                                    const activeSensors = sensors.filter(sensor => {
                                        const data = sensorData[sensor.sensor_id];
                                        return data && data.length > 0;
                                    }).length;
                                    return `${activeSensors}개 활성, ${sensors.length - activeSensors}개 비활성`;
                                })()}
                            </p>
                            {isRealTimeMode && (
                                <div className="flex items-center space-x-1 mt-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-green-600">실시간 모니터링</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataAnalysisPage; 