// File: frontend/src/pages/SettingsPage.js
import React from 'react';
import { Settings } from 'lucide-react';

const SettingsPage = () => {
    return (
        <div>
            <div className="flex items-center space-x-3 mb-6 border-b pb-4">
                <Settings size={32} className="text-gray-600" />
                <h2 className="text-2xl font-semibold text-gray-800">System Settings</h2>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
                <p className="text-gray-700">
                    Configure general application settings, user preferences, notification settings,
                    and other system-wide parameters.
                </p>
                 <div className="mt-6 h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400 italic">Settings configuration UI will be here.</p>
                </div>
            </div>
        </div>
    );
};
export default SettingsPage;