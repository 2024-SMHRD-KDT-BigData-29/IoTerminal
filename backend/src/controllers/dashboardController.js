// File: backend/src/controllers/dashboardController.js
const { 
    summaryStats, 
    sensorStatusData, 
    recentWorkflowsDashboard, 
    apiIntegrationStatus 
} = require('../data/dummyData');

exports.getDashboardSummary = (req, res) => {
    // Simulate small random changes for dynamic feel in presentation
    const dynamicSummary = {
        ...summaryStats,
        activeSensors: summaryStats.activeSensors + Math.floor(Math.random() * 3) - 1,
        errorRate: `${(parseFloat(summaryStats.errorRate) + (Math.random() * 0.2 - 0.1)).toFixed(1)}%`
    };
    res.json(dynamicSummary);
};

exports.getSensorStatuses = (req, res) => {
    // Simulate status changes
    const dynamicSensorStatus = sensorStatusData.map(sensor => {
        let newStatus = sensor.status;
        if (Math.random() < 0.1) { // 10% chance to change status
            const statuses = ["정상", "주의", "오류"];
            newStatus = statuses[Math.floor(Math.random() * statuses.length)];
        }
        return {...sensor, status: newStatus, value: sensor.name.includes("온도") ? `${(20 + Math.random()*5).toFixed(1)}°C` : sensor.value};
    });
    res.json(dynamicSensorStatus);
};

exports.getRecentWorkflows = (req, res) => {
    res.json(recentWorkflowsDashboard);
};

exports.getApiStatuses = (req, res) => {
    res.json(apiIntegrationStatus);
};