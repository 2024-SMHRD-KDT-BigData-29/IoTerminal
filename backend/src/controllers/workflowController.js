// File: backend/src/controllers/workflowController.js
const pool = require('../config/database');

exports.createWorkflow = async (req, res) => {
    const { name, description, nodes, edges, isPublic } = req.body;
    const userId = req.user.userId;
    
    console.log('워크플로우 생성 요청:', { name, userId });

    if (!name) {
        return res.status(400).json({ 
            success: false,
            message: '워크플로우 이름은 필수입니다.' 
        });
    }

    try {
        const [result] = await pool.execute(
            'INSERT INTO workflows (name, description, nodes, edges, user_id, is_public) VALUES (?, ?, ?, ?, ?, ?)',
            [
                name,
                description || '',
                JSON.stringify(nodes || []),
                JSON.stringify(edges || []),
                userId,
                isPublic || false
            ]
        );

        const workflowId = result.insertId;
        console.log('워크플로우 생성 성공:', { workflowId, name });

        res.status(201).json({ 
            success: true,
            message: '워크플로우가 성공적으로 저장되었습니다.',
            workflow: {
                workflow_id: workflowId,
                name,
                description,
                nodes,
                edges,
                user_id: userId,
                is_public: isPublic
            }
        });

    } catch (error) {
        console.error('워크플로우 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '워크플로우 저장 중 오류가 발생했습니다.'
        });
    }
};

exports.getUserWorkflows = async (req, res) => {
    try {
        const userId = req.user.userId;
        const [workflows] = await pool.execute(
            'SELECT workflow_id, name, description, created_at, updated_at, is_public FROM workflows WHERE user_id = ? OR is_public = true ORDER BY updated_at DESC',
            [userId]
        );

        res.json({
            success: true,
            workflows
        });
    } catch (error) {
        console.error('워크플로우 목록 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '워크플로우 목록 조회 중 오류가 발생했습니다.'
        });
    }
};

exports.getWorkflowById = async (req, res) => {
    try {
        const { workflowId } = req.params;
        const userId = req.user.userId;

        const [workflows] = await pool.execute(
            'SELECT * FROM workflows WHERE workflow_id = ? AND (user_id = ? OR is_public = true)',
            [workflowId, userId]
        );

        if (workflows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '워크플로우를 찾을 수 없거나 접근 권한이 없습니다.'
            });
        }

        const workflow = workflows[0];
        
        // nodes와 edges가 이미 객체인 경우를 처리
        try {
            if (typeof workflow.nodes === 'string') {
                workflow.nodes = JSON.parse(workflow.nodes);
            } else if (!workflow.nodes) {
                workflow.nodes = [];
            }
            
            if (typeof workflow.edges === 'string') {
                workflow.edges = JSON.parse(workflow.edges);
            } else if (!workflow.edges) {
                workflow.edges = [];
            }
        } catch (parseError) {
            console.error('JSON 파싱 오류:', parseError);
            workflow.nodes = workflow.nodes || [];
            workflow.edges = workflow.edges || [];
        }

        res.json({
            success: true,
            workflow
        });
    } catch (error) {
        console.error('워크플로우 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '워크플로우 조회 중 오류가 발생했습니다.'
        });
    }
};

exports.updateWorkflow = async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { name, description, nodes, edges, isPublic } = req.body;
        const userId = req.user.userId;

        // 워크플로우 존재 여부와 권한 확인
        const [existingWorkflow] = await pool.execute(
            'SELECT * FROM workflows WHERE workflow_id = ? AND (user_id = ? OR is_public = true)',
            [workflowId, userId]
        );

        if (existingWorkflow.length === 0) {
            return res.status(404).json({
                success: false,
                message: '워크플로우를 찾을 수 없거나 수정 권한이 없습니다.'
            });
        }

        // 워크플로우 업데이트
        const [result] = await pool.execute(
            'UPDATE workflows SET name = ?, description = ?, nodes = ?, edges = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP WHERE workflow_id = ? AND user_id = ?',
            [
                name,
                description || '',
                JSON.stringify(nodes || []),
                JSON.stringify(edges || []),
                isPublic || false,
                workflowId,
                userId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '워크플로우를 찾을 수 없거나 수정 권한이 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '워크플로우가 성공적으로 수정되었습니다.',
            workflow: {
                workflow_id: workflowId,
                name,
                description,
                nodes,
                edges,
                user_id: userId,
                is_public: isPublic
            }
        });
    } catch (error) {
        console.error('워크플로우 수정 실패:', error);
        res.status(500).json({
            success: false,
            message: '워크플로우 수정 중 오류가 발생했습니다.'
        });
    }
};

exports.deleteWorkflow = async (req, res) => {
    try {
        const { workflowId } = req.params;
        const userId = req.user.userId;

        const [result] = await pool.execute(
            'DELETE FROM workflows WHERE workflow_id = ? AND user_id = ?',
            [workflowId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '워크플로우를 찾을 수 없거나 삭제 권한이 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '워크플로우가 성공적으로 삭제되었습니다.'
        });
    } catch (error) {
        console.error('워크플로우 삭제 실패:', error);
        res.status(500).json({
            success: false,
            message: '워크플로우 삭제 중 오류가 발생했습니다.'
        });
    }
};