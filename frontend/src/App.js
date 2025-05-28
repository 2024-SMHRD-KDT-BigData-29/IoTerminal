// File: frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WorkflowPage from './pages/WorkflowPage';
import WorkflowCanvasPage from './pages/WorkflowCanvasPage';
// import DataManagementPage from './pages/DataManagementPage';
import IotDevicesPage from './pages/IotDevicesPage';
import TestInputPage from './pages/TestInputPage';
import SettingsPage from './pages/SettingsPage';
import NotificationSettingsPage from './pages/settings/NotificationSettingsPage';
import DataAnalysisPage from './pages/DataAnalysisPage';
import SensorAlertHistoryPage from './pages/SensorAlertHistoryPage';
import { getCurrentUserToken } from './services/authService';

const PrivateRoutes = () => {
    const isAuthenticated = !!getCurrentUserToken();
    return isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Routes */}
                <Route element={<PrivateRoutes />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/workflow" element={<WorkflowPage />} />
                    <Route path="/workflow/:workflowId" element={<WorkflowPage />} />
                    <Route path="/workflow/name/:workflowName" element={<WorkflowPage />} />
                    <Route path="/workflow/new" element={<WorkflowCanvasPage />} />
                    <Route path="/workflow/edit/:workflowId" element={<WorkflowCanvasPage />} />
                    <Route path="/test-input" element={<TestInputPage />} />
                    
                    {/* IoT 디바이스 관련 라우트 */}
                    <Route path="/iot/devices" element={<Navigate to="/iot/devices/management" replace />} />
                    <Route path="/iot/devices/management" element={<IotDevicesPage />} />
                    <Route path="/iot/devices/analysis" element={<DataAnalysisPage />} />
                    
                    {/* 센서 알림 설정 라우트 */}
                    <Route path="/sensor-alerts/settings" element={<NotificationSettingsPage />} />
                    <Route path="/sensor-alerts/history" element={<SensorAlertHistoryPage />} />
                    <Route path="/sensor-alerts" element={<Navigate to="/sensor-alerts/history" replace />} />
                    
                    {/* 설정 관련 라우트 */}
                    <Route path="/settings" element={<NotificationSettingsPage />} />
                    <Route path="/account" element={<SettingsPage />} />
                </Route>

                {/* Fallback Routes */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;