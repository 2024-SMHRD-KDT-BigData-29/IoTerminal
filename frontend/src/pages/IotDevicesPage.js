// File: frontend/src/pages/IotDevicesPage.js
import React, { useState, useEffect } from 'react';
import { BarChart as IconBarChart, Battery, Wifi, AlertTriangle } from 'lucide-react';
import { getUserDevices } from '../services/deviceService';

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
            </div>
        </div>
    );
};

const IotDevicesPage = () => {
    const [devices, setDevices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadDevices = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const deviceList = await getUserDevices();
                setDevices(deviceList);
            } catch (err) {
                setError('디바이스 목록을 불러오는데 실패했습니다.');
                console.error('디바이스 로드 오류:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadDevices();
    }, []);

    return (
        <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
                <IconBarChart size={32} className="text-purple-600" />
                <h2 className="text-2xl font-semibold text-gray-800">IoT 디바이스 관리</h2>
            </div>

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