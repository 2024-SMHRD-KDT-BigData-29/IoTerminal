// File: frontend/src/pages/IotDevicesPage.js
import React, { useState, useEffect } from 'react';
import { BarChart as IconBarChart, Battery, Wifi, AlertTriangle, Plus } from 'lucide-react';
import { getUserDevices, getDeviceSensors } from '../services/deviceService';
import DeviceCreateForm from '../components/device/DeviceCreateForm';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

const DeviceStatusBadge = ({ status }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-gray-100 text-gray-800';
            case 'error':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status === 'active' ? '활성' : status === 'inactive' ? '비활성' : '오류'}
        </span>
    );
};

const DeviceCard = ({ device }) => {
    const [sensors, setSensors] = useState([]);
    const [sensorData, setSensorData] = useState(null);

    const getBatteryColor = (level) => {
        if (level > 70) return 'text-green-500';
        if (level > 30) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getLastReadingText = (device) => {
        if (!device.status?.last_reading) return '데이터 없음';
        
        switch (device.type) {
            case 'TEMPERATURE':
                return `${device.status.last_reading}°C`;
            case 'HUMIDITY':
                return `${device.status.last_reading}%`;
            case 'CO2':
                return `${device.status.last_reading} ppm`;
            case 'MOTION':
                return device.status.last_detection || '감지 없음';
            default:
                return `${device.status.last_reading}`;
        }
    };

    useEffect(() => {
        if (device.device_id) {
            getDeviceSensors(device.device_id).then(sensorList => {
                setSensors(sensorList);
                // 센서 데이터 가공
                const statusCount = {
                    active: sensorList.filter(s => s.status === 'active').length,
                    inactive: sensorList.filter(s => s.status === 'inactive').length,
                    error: sensorList.filter(s => s.status === 'error').length
                };
                setSensorData({
                    labels: ['활성', '비활성', '오류'],
                    datasets: [{
                        data: Object.values(statusCount),
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(255, 99, 132, 0.6)'
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(255, 99, 132, 1)'
                        ],
                        borderWidth: 1
                    }]
                });
            }).catch(() => setSensors([]));
        }
    }, [device.device_id]);

    return (
        <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">{device.name}</h3>
                    <p className="text-sm text-gray-500">{device.description}</p>
                </div>
                <DeviceStatusBadge status={
                    device.status?.online === true ||
                    device.status?.online === 1 ||
                    device.status?.online === 'true'
                        ? 'active'
                        : 'inactive'
                } />
            </div>
            
            <div className="border-t pt-3">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                        <Battery className={`mr-2 ${getBatteryColor(device.status?.battery)}`} size={18} />
                        <span className="text-sm">{device.status?.battery || 0}%</span>
                    </div>
                    <div className="flex items-center">
                        <Wifi className="mr-2 text-blue-500" size={18} />
                        <span className="text-sm">연결됨</span>
                    </div>
                </div>
                <div className="mt-3">
                    <p className="text-sm text-gray-600">
                        최근 측정값: {getLastReadingText(device)}
                    </p>
                </div>
                <div className="mt-3">
                    <p className="text-xs text-gray-500 font-semibold mb-1">연결된 센서</p>
                    {sensors.length === 0 ? (
                        <span className="text-xs text-gray-400">센서 없음</span>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <ul className="text-xs text-gray-700 space-y-0.5">
                                {sensors.map(sensor => (
                                    <li key={sensor.sensor_id}>
                                        {sensor.name} <span className="text-gray-400">({sensor.type})</span>
                                    </li>
                                ))}
                            </ul>
                            {sensorData && (
                                <div className="h-24">
                                    <Doughnut
                                        data={sensorData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    display: false
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Modal = ({ open, onClose, children }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-[#2a2139] rounded-xl shadow-lg p-8 min-w-[320px] max-w-lg w-full relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl">&times;</button>
                {children}
            </div>
        </div>
    );
};

const IotDevicesPage = () => {
    const [devices, setDevices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [allSensors, setAllSensors] = useState([]);

    const reloadDevices = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const deviceList = await getUserDevices();
            setDevices(deviceList);
            
            // 모든 디바이스의 센서 정보 수집
            const allSensorList = [];
            for (const device of deviceList) {
                try {
                    const sensors = await getDeviceSensors(device.device_id);
                    allSensorList.push(...sensors);
                } catch (err) {
                    console.error(`디바이스 ${device.device_id}의 센서 로드 실패:`, err);
                }
            }
            setAllSensors(allSensorList);
        } catch (err) {
            setError('디바이스 목록을 불러오는데 실패했습니다.');
            console.error('디바이스 로드 오류:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        reloadDevices();
    }, []);

    const handleOpenModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);
    const handleSuccess = () => {
        setShowModal(false);
        reloadDevices();
    };

    // 전체 센서 상태 분포 데이터
    const getOverallSensorStatus = () => {
        const statusCount = {
            active: allSensors.filter(s => s.status === 'active').length,
            inactive: allSensors.filter(s => s.status === 'inactive').length,
            error: allSensors.filter(s => s.status === 'error').length
        };

        return {
            labels: ['활성', '비활성', '오류'],
            datasets: [{
                data: Object.values(statusCount),
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        };
    };

    return (
        <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
                <IconBarChart size={32} className="text-purple-600" />
                <h2 className="text-2xl font-semibold text-gray-800">IoT 디바이스 관리</h2>
                <button
                    onClick={handleOpenModal}
                    className="ml-auto flex items-center px-4 py-2 bg-[#7e57c2] dark:bg-[#9575cd] text-white rounded-lg hover:bg-[#5e35b1] dark:hover:bg-[#b39ddb] transition-colors duration-200"
                >
                    <Plus size={18} className="mr-2" /> 디바이스 등록
                </button>
            </div>

            {/* 전체 센서 상태 요약 */}
            <div className="mb-6 bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">전체 센서 상태</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-64">
                        <Doughnut
                            data={getOverallSensorStatus()}
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
                    </div>
                    <div className="flex flex-col justify-center">
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full bg-[rgba(75,192,192,0.6)] mr-2"></div>
                                <span className="text-sm">활성: {allSensors.filter(s => s.status === 'active').length}개</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full bg-[rgba(255,206,86,0.6)] mr-2"></div>
                                <span className="text-sm">비활성: {allSensors.filter(s => s.status === 'inactive').length}개</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full bg-[rgba(255,99,132,0.6)] mr-2"></div>
                                <span className="text-sm">오류: {allSensors.filter(s => s.status === 'error').length}개</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal open={showModal} onClose={handleCloseModal}>
                <h3 className="text-xl font-bold mb-4 text-[#3a2e5a] dark:text-[#b39ddb]">디바이스 등록</h3>
                <DeviceCreateForm onSuccess={handleSuccess} />
            </Modal>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                    <AlertTriangle className="text-red-500 mr-2" size={20} />
                    <p className="text-red-700">{error}</p>
                </div>
            ) : devices.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-500">등록된 디바이스가 없습니다.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {devices.map((device) => (
                        <DeviceCard key={device.device_id} device={device} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default IotDevicesPage;