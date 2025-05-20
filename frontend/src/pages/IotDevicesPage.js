// File: frontend/src/pages/IotDevicesPage.js
import React from 'react';
import { BarChart as IconBarChart } from 'lucide-react'; // Renamed to avoid conflict

const IotDevicesPage = () => {
    return (
        <div>
            <div className="flex items-center space-x-3 mb-6 border-b pb-4">
                <IconBarChart size={32} className="text-purple-600" /> {/* Using the aliased import */}
                <h2 className="text-2xl font-semibold text-gray-800">IoT Device Management</h2>
            </div>
             <div className="bg-white p-8 rounded-xl shadow-lg">
                <p className="text-gray-700">
                    View and manage connected IoT devices (e.g., ESP32, DHT11).
                    Check device status, firmware versions, and configure device-specific settings.
                </p>
                 <div className="mt-6 h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400 italic">Device list and management UI will be here.</p>
                </div>
            </div>
        </div>
    );
};
export default IotDevicesPage;