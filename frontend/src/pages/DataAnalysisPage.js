import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
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
} from 'chart.js';
import { getDeviceUsageData, getUsagePatternData, getEfficiencyData, getInsightsData } from '../services/analysisService';

// Chart.js 등록
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const DataAnalysisPage = () => {
    const [selectedDevice, setSelectedDevice] = useState('');
    const [timeRange, setTimeRange] = useState('day');
    const [analysisType, setAnalysisType] = useState('usage');
    const [deviceData, setDeviceData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (selectedDevice) {
            fetchData();
        }
    }, [selectedDevice, timeRange, analysisType]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [usageData, patternData, efficiencyData, insightsData] = await Promise.all([
                getDeviceUsageData(selectedDevice, timeRange),
                getUsagePatternData(selectedDevice, timeRange),
                getEfficiencyData(selectedDevice, timeRange),
                getInsightsData(selectedDevice)
            ]);

            setDeviceData({
                usage: usageData,
                pattern: patternData,
                efficiency: efficiencyData,
                insights: insightsData
            });
        } catch (err) {
            setError('데이터를 불러오는데 실패했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeviceChange = (deviceId) => {
        setSelectedDevice(deviceId);
        // 여기서 선택된 기기의 데이터를 가져오는 API 호출
    };

    const handleTimeRangeChange = (range) => {
        setTimeRange(range);
        // 시간 범위에 따른 데이터 필터링
    };

    const handleAnalysisTypeChange = (type) => {
        setAnalysisType(type);
        // 분석 유형에 따른 차트 변경
    };

    const renderCharts = () => {
        if (loading) {
            return <div className="text-center">데이터를 불러오는 중...</div>;
        }

        if (error) {
            return <div className="text-red-500 text-center">{error}</div>;
        }

        if (!deviceData) {
            return <div className="text-center">기기를 선택해주세요.</div>;
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 사용량 차트 */}
                <div className="bg-white dark:bg-[#3a2e5a] p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold text-[#7e57c2] dark:text-[#b39ddb] mb-4">에너지 사용량 추이</h3>
                    <Line data={deviceData.usage} />
                </div>

                {/* 패턴 분석 차트 */}
                <div className="bg-white dark:bg-[#3a2e5a] p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold text-[#7e57c2] dark:text-[#b39ddb] mb-4">사용 패턴 분석</h3>
                    <Bar data={deviceData.pattern} />
                </div>

                {/* 효율성 분석 차트 */}
                <div className="bg-white dark:bg-[#3a2e5a] p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold text-[#7e57c2] dark:text-[#b39ddb] mb-4">효율성 분석</h3>
                    <Pie data={deviceData.efficiency} />
                </div>

                {/* 인사이트 요약 */}
                <div className="bg-white dark:bg-[#3a2e5a] p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold text-[#7e57c2] dark:text-[#b39ddb] mb-4">주요 인사이트</h3>
                    <div className="space-y-4">
                        {deviceData.insights.map((insight, index) => (
                            <div key={index} className="p-4 bg-[#f8f6fc] dark:bg-[#2a2139] rounded-lg">
                                <p className="text-[#3a2e5a] dark:text-[#b39ddb]">
                                    {insight.message}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#7e57c2] dark:text-[#b39ddb] mb-4">데이터 분석</h2>
                <div className="flex gap-4 mb-6">
                    <select
                        value={selectedDevice}
                        onChange={(e) => handleDeviceChange(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-[#b39ddb] bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb]"
                    >
                        <option value="">기기 선택</option>
                        <option value="device1">기기 1</option>
                        <option value="device2">기기 2</option>
                    </select>
                    <select
                        value={timeRange}
                        onChange={(e) => handleTimeRangeChange(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-[#b39ddb] bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb]"
                    >
                        <option value="day">일간</option>
                        <option value="week">주간</option>
                        <option value="month">월간</option>
                        <option value="year">연간</option>
                    </select>
                    <select
                        value={analysisType}
                        onChange={(e) => handleAnalysisTypeChange(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-[#b39ddb] bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb]"
                    >
                        <option value="usage">사용량 분석</option>
                        <option value="pattern">사용 패턴</option>
                        <option value="efficiency">효율성 분석</option>
                    </select>
                </div>
            </div>

            {renderCharts()}
        </div>
    );
};

export default DataAnalysisPage; 