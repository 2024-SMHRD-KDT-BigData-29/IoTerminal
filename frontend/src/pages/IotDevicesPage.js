// File: frontend/src/pages/IotDevicesPage.js
import React from 'react';
import { BarChart as IconBarChart } from 'lucide-react'; // Renamed to avoid conflict

const IotDevicesPage = () => {
    return (
        <div>
            <div className="flex items-center space-x-3 mb-6 border-b pb-4">
                <IconBarChart size={32} className="text-purple-600" /> {/* Using the aliased import */}
                <h2 className="text-2xl font-semibold text-gray-800">IoT 디바이스 관리</h2>
            </div>
             <div className="bg-white p-8 rounded-xl shadow-lg">
                <p className="text-gray-700">
                    연결된 IoT 디바이스(예: ESP32, DHT11)를 확인하고 관리합니다.
                    디바이스 상태, 펌웨어 버전을 확인하고 디바이스별 설정을 구성할 수 있습니다.
                </p>
                 <div className="mt-6 h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400 italic">디바이스 목록과 관리 UI가 여기에 표시됩니다.</p>
                </div>
            </div>
        </div>
    );
};
export default IotDevicesPage;