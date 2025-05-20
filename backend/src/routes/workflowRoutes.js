const express = require('express');
const { 
    createWorkflow, 
    getUserWorkflows,
    getWorkflowById,
    updateWorkflow,
    deleteWorkflow 
} = require('../controllers/workflowController');

// Mock authentication middleware (very basic for presentation)
const mockAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer mockToken')) { // Expecting "Bearer mockToken..."
        // In a real mock, you might decode a fake JWT or just assign a mock user
        req.user = { userId: 'mockUser1', username: '김유진', role: 'PM' }; 
        console.log('Mock Auth Middleware: User authenticated', req.user);
    } else {
        // For some GET routes, we might allow access or handle differently for mock
        // For POST/PUT/DELETE, we might strictly require a token.
        // For this mockup, we'll be less strict on GET if no token.
        // If it's a modification route, you might want to return 401.
        // For now, allow to proceed but req.user might be undefined.
        // Controller must handle undefined req.user if not all routes are strictly protected.
        // For simplicity, let's assume most routes that need user will use a default if not found.
        console.log('Mock Auth Middleware: No or invalid token, proceeding without req.user for some routes.');
    }
    next();
};

const router = express.Router();
router.use(mockAuthMiddleware); // Apply mock auth to all workflow routes

router.post('/', createWorkflow);
router.get('/', getUserWorkflows);
router.get('/:workflowId', getWorkflowById);
router.put('/:workflowId', updateWorkflow);
router.delete('/:workflowId', deleteWorkflow);

module.exports = router;