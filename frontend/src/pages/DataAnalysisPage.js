import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { 
    getDeviceUsageData, 
    getDeviceSensorData, 
    getDeviceEventLogs,
    getDevicePerformanceStats 
} from '../services/analysisService';
import { getUserDevices } from '../services/deviceService';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
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

    // 분석 데이터 로드
    useEffect(() => {
        const fetchAnalysisData = async () => {
            if (!selectedDevice) return;

            const dateRange = getDateRange();
            if (!dateRange) return;

            setLoading(true);
            setError('');
            try {
                let data;
                switch (analysisType) {
                    case 'usage':
                        data = await getDeviceUsageData(selectedDevice, dateRange);
                        break;
                    case 'sensor':
                        data = await getDeviceSensorData(selectedDevice, dateRange);
                        break;
                    case 'events':
                        data = await getDeviceEventLogs(selectedDevice, dateRange);
                        break;
                    case 'performance':
                        data = await getDevicePerformanceStats(selectedDevice, dateRange);
                        break;
                    default:
                        throw new Error('지원하지 않는 분석 유형입니다.');
                }
                setChartData(formatChartData(data));
            } catch (error) {
                console.error('데이터 분석 실패:', error);
                setError('데이터를 불러오는데 실패했습니다.');
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

        return {
            labels: data.data.map(item => new Date(item.timestamp).toLocaleString()),
            datasets: [
                {
                    label: data.label || '데이터',
                    data: data.data.map(item => item.value),
                    borderColor: '#7e57c2',
                    backgroundColor: 'rgba(126, 87, 194, 0.1)',
                    tension: 0.1
                }
            ]
        };
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">데이터 분석</h2>
            
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

            {/* 차트 표시 영역 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-[400px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-[400px] text-red-500">
                        {error}
                    </div>
                ) : chartData ? (
                    <Line
                        data={chartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'top',
                                },
                                title: {
                                    display: true,
                                    text: `${devices.find(d => d.device_id === selectedDevice)?.name || '디바이스'} 분석 결과`
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }}
                    />
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