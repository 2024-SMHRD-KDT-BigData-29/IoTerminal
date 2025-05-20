// File: frontend/src/pages/settings/AccountSettingsPage.js
import React from 'react';
import { UserCircle } from 'lucide-react'; // Example icon

const AccountSettingsPage = () => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center space-x-3 mb-6 border-b pb-4">
                <UserCircle size={28} className="text-sky-600" />
                <h3 className="text-xl font-semibold text-gray-700">Account Settings</h3>
            </div>
            <p className="text-gray-600">
                Your account settings and profile information will be managed here.
            </p>
            <div className="mt-6 h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-400 italic">Account settings form (e.g., change email, password, profile picture) will be implemented here.</p>
            </div>
        </div>
    );
};

export default AccountSettingsPage;