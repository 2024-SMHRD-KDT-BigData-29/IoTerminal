// File: backend/src/routes/dashboardRoutes.js
const express = require('express');
const { 
    getDashboardSummary, 
    getSensorStatuses, 
    getRecentWorkflows, 
    getApiStatuses 
} = require('../controllers/dashboardController');
const router = express.Router();

// These routes might not need strict auth for a public-facing part of a dashboard mockup,
// or could use the same mockAuthMiddleware if specific user data influenced them.
// For simplicity, not adding auth middleware here, assuming general dashboard data.

router.get('/summary', getDashboardSummary);
router.get('/sensor-status', getSensorStatuses);
router.get('/recent-workflows', getRecentWorkflows); // Matches dashboard.tsx component
router.get('/api-status', getApiStatuses);         // Matches dashboard.tsx component

module.exports = router;