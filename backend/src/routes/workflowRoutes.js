const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { 
    createWorkflow, 
    getUserWorkflows,
    getWorkflowById,
    updateWorkflow,
    deleteWorkflow,
    getRecentWorkflows
} = require('../controllers/workflowController');

const JWT_SECRET = 'mock-jwt-secret-for-presentation';

// 인증 미들웨어
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: '인증 토큰이 필요합니다.'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('토큰 검증 실패:', error);
        return res.status(403).json({
            success: false,
            error: '유효하지 않은 토큰입니다.'
        });
    }
};

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 워크플로우 라우트
router.post('/', createWorkflow);
router.get('/list', getUserWorkflows);
router.get('/recent', getRecentWorkflows);
router.get('/:workflowId', getWorkflowById);
router.put('/:workflowId', (req, res, next) => {
    console.log('[디버깅] PUT /api/workflow/:workflowId 라우터 진입');
    next();
}, updateWorkflow);
router.delete('/:workflowId', deleteWorkflow);

module.exports = router;