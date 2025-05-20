// File: frontend/src/pages/settings/NotificationSettingsPage.js
import React from 'react';
import { BellRing } from 'lucide-react'; // Example icon

const NotificationSettingsPage = () => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center space-x-3 mb-6 border-b pb-4">
                <BellRing size={28} className="text-orange-500" />
                <h3 className="text-xl font-semibold text-gray-700">Notification Settings</h3>
            </div>
            <p className="text-gray-600">
                Manage your notification preferences for email, SMS, and in-app alerts.
            </p>
            <div className="mt-6 h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-400 italic">Notification preferences UI (e.g., toggles for different alert types) will be implemented here.</p>
            </div>
        </div>
    );
};

export default NotificationSettingsPage;