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

    // 디바이스 선택 시 센서 목록 및 데이터 로드 (센서 분석일 때만)
    useEffect(() => {
        if (selectedDevice && analysisType === 'sensor') {
            console.log('디바이스 센서 목록 API 호출 시작:', selectedDevice);
            getDeviceSensors(selectedDevice).then(sensorList => {
                console.log('디바이스 센서 목록 응답:', sensorList);
                setSensors(sensorList);
                // 각 센서별로 시계열 데이터 조회
                sensorList.forEach(sensor => {
                    if (sensor.sensor_id) {
                        console.log(`센서 ${sensor.sensor_id} 시계열 데이터 API 호출 시작`);
                        axios.get(`/api/sensors/${sensor.sensor_id}/timeseries?farmno=1&zone=A`)
                            .then(res => {
                                console.log(`센서 ${sensor.sensor_id} 시계열 데이터 응답:`, res.data);
                                setSensorData(prev => ({
                                    ...prev,
                                    [sensor.sensor_id]: res.data.data || []
                                }));
                            })
                            .catch(err => {
                                console.error(`센서 ${sensor.sensor_id} 시계열 데이터 로드 실패:`, err);
                                // 404 오류는 무시하고 빈 배열로 설정
                                setSensorData(prev => ({
                                    ...prev,
                                    [sensor.sensor_id]: []
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
        }
    }, [selectedDevice, analysisType]);

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
                <h4 className="text-lg font-bold mb-4 text-[#7e57c2]">
                    {analysisType === 'usage' && '사용량 분석'}
                    {analysisType === 'sensor' && '센서 데이터 분석'}
                    {analysisType === 'events' && '이벤트 로그 분석'}
                    {analysisType === 'performance' && '성능 분석'}
                </h4>
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
                        {analysisType === 'sensor' && <Line data={chartData} options={{
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
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">센서별 상세 데이터</h3>
                    {sensors.map((sensor, index) => {
                        const chartType = index % 3; // 0: Line, 1: Bar, 2: Doughnut
                        const sensorValues = (sensorData[sensor.sensor_id] || []).map(d => d.value);
                        
                        return (
                            <div key={sensor.sensor_id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
                                <h4 className="text-lg font-bold mb-4 text-[#7e57c2]">{sensor.name} ({sensor.type})</h4>
                                <div className="h-[300px]">
                                    {chartType === 0 && (
                                        <Line
                                            data={{
                                                labels: (sensorData[sensor.sensor_id] || []).map(d => 
                                                    new Date(d.timestamp).toLocaleTimeString('ko-KR', { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })
                                                ),
                                                datasets: [{
                                                    label: sensor.name,
                                                    data: sensorValues,
                                                    borderColor: '#7e57c2',
                                                    backgroundColor: 'rgba(126, 87, 194, 0.1)',
                                                    tension: 0.2,
                                                    fill: true
                                                }]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        display: true
                                                    }
                                                },
                                                scales: {
                                                    y: {
                                                        beginAtZero: true
                                                    }
                                                }
                                            }}
                                        />
                                    )}
                                    {chartType === 1 && (
                                        <Bar
                                            data={{
                                                labels: (sensorData[sensor.sensor_id] || []).slice(-10).map(d => 
                                                    new Date(d.timestamp).toLocaleTimeString('ko-KR', { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })
                                                ),
                                                datasets: [{
                                                    label: sensor.name,
                                                    data: sensorValues.slice(-10),
                                                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                                                    borderColor: 'rgba(54, 162, 235, 1)',
                                                    borderWidth: 1
                                                }]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        display: true
                                                    }
                                                },
                                                scales: {
                                                    y: {
                                                        beginAtZero: true
                                                    }
                                                }
                                            }}
                                        />
                                    )}
                                    {chartType === 2 && sensorValues.length > 0 && (
                                        <Doughnut
                                            data={{
                                                labels: ['최소값', '평균값', '최대값'],
                                                datasets: [{
                                                    data: [
                                                        Math.min(...sensorValues),
                                                        sensorValues.reduce((a, b) => a + b, 0) / sensorValues.length,
                                                        Math.max(...sensorValues)
                                                    ],
                                                    backgroundColor: [
                                                        'rgba(255, 99, 132, 0.6)',
                                                        'rgba(255, 206, 86, 0.6)',
                                                        'rgba(75, 192, 192, 0.6)'
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
                                </div>
                                {/* 센서 통계 정보 */}
                                <div className="mt-4 grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500">최신값</p>
                                        <p className="text-lg font-bold text-blue-600">
                                            {sensorValues.length > 0 ? sensorValues[sensorValues.length - 1].toFixed(1) : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500">평균값</p>
                                        <p className="text-lg font-bold text-green-600">
                                            {sensorValues.length > 0 ? (sensorValues.reduce((a, b) => a + b, 0) / sensorValues.length).toFixed(1) : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500">최대값</p>
                                        <p className="text-lg font-bold text-red-600">
                                            {sensorValues.length > 0 ? Math.max(...sensorValues).toFixed(1) : 'N/A'}
                                        </p>
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
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">센서 데이터 요약</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">온도 센서</h4>
                            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">23.5°C</p>
                            <p className="text-sm text-blue-600">정상 범위</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">습도 센서</h4>
                            <p className="text-2xl font-bold text-green-800 dark:text-green-200">65%</p>
                            <p className="text-sm text-green-600">적정 습도</p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                            <h4 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">가스 센서</h4>
                            <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">0.02ppm</p>
                            <p className="text-sm text-yellow-600">안전 수준</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">연결 상태</h4>
                            <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{sensors.length}개</p>
                            <p className="text-sm text-purple-600">센서 연결됨</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataAnalysisPage; 