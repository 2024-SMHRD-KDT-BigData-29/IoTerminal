// File: frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WorkflowPage from './pages/WorkflowPage';
import WorkflowCanvasPage from './pages/WorkflowCanvasPage';
import DataManagementPage from './pages/DataManagementPage';
import IotDevicesPage from './pages/IotDevicesPage';
import SettingsPage from './pages/SettingsPage';
import DataAnalysisPage from './pages/DataAnalysisPage';
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
                    <Route path="/iot/devices" element={<IotDevicesPage />} />
                    <Route path="/iot/devices/management" element={<IotDevicesPage />} />
                    <Route path="/iot/devices/analysis" element={<DataAnalysisPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Fallback Routes */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;