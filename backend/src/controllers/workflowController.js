// File: backend/src/controllers/workflowController.js
const pool = require('../config/database');

exports.createWorkflow = async (req, res) => {
    const { name, description, nodes: rawNodes, edges: rawEdges, isPublic, deviceSensorLinks } = req.body;
    let nodes = rawNodes;
    let edges = rawEdges;
    const userId = req.user.user_id;
    
    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'user_id가 필요합니다.'
        });
    }

    // 엣지 데이터 유효성 검사
    if (edges && Array.isArray(edges)) {
        const validEdges = edges.filter(edge => {
            return edge.data && 
                   edge.data.id && 
                   edge.data.source && 
                   edge.data.target &&
                   edge.data.source !== edge.data.target;
        });

        if (validEdges.length !== edges.length) {
            console.warn('일부 유효하지 않은 엣지가 제거되었습니다:', {
                originalCount: edges.length,
                validCount: validEdges.length
            });
        }

        // 엣지 데이터 정규화
        edges = validEdges.map(edge => ({
            data: {
                id: edge.data.id,
                source: edge.data.source,
                target: edge.data.target,
                label: edge.data.label || '',
                type: edge.data.type || 'default'
            }
        }));
    }

    console.log('워크플로우 생성 요청:', { 
        name, 
        userId,
        nodesCount: nodes?.length,
        edgesCount: edges?.length,
        deviceSensorLinks 
    });

    if (!name) {
        return res.status(400).json({ 
            success: false,
            message: '워크플로우 이름은 필수입니다.' 
        });
    }

    try {
        // 트랜잭션 시작
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. 워크플로우 저장
            const [result] = await connection.query(
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
            console.log('[워크플로우 생성] 성공:', { workflowId, userId, affectedRows: result.affectedRows, edges });

            // 2. device_sensors 연결 정보 저장
            console.log('[디버깅] deviceSensorLinks:', deviceSensorLinks);
            if (deviceSensorLinks && deviceSensorLinks.length > 0) {
                try {
                    // 기존 연결 삭제 (workflow_id 기준)
                    console.log('[디버깅] 기존 device_sensors 삭제 시도, workflowId:', workflowId);
                    const [deleteResult] = await connection.query(
                        'DELETE FROM device_sensors WHERE workflow_id = ?',
                        [workflowId]
                    );
                    console.log('[디버깅] 삭제 결과:', deleteResult);

                    // 새로운 연결 추가 (workflow_id 포함)
                    const values = deviceSensorLinks.map(link => [
                        workflowId,
                        link.device_id,
                        link.sensor_id,
                        JSON.stringify(link.config || {})
                    ]);
                    console.log('[디버깅] 추가할 values:', values);

                    if (values.length > 0) {
                        // 디버깅: 쿼리 실행 전 상세 로그
                        console.log('[디버깅] deviceSensorLinks:', deviceSensorLinks);
                        console.log('[디버깅] values:', values);
                        const placeholders = values.map(() => '(?, ?, ?, ?)').join(', ');
                        console.log('[디버깅] placeholders:', placeholders);
                        const flatValues = values.flat();
                        console.log('[디버깅] flatValues:', flatValues);
                        const sql = `INSERT INTO device_sensors (workflow_id, device_id, sensor_id, config) VALUES ${placeholders}`;
                        console.log('[디버깅] sql:', sql);
                        try {
                            const [insertResult] = await connection.execute(sql, flatValues);
                            console.log('[디버깅] insertResult:', insertResult);
                        } catch (insertErr) {
                            console.error('[디버깅] INSERT 쿼리 실행 중 에러:', insertErr);
                            console.error('[디버깅] 쿼리:', sql);
                            console.error('[디버깅] 파라미터:', flatValues);
                            throw insertErr;
                        }
                    }
                } catch (error) {
                    console.error('디바이스-센서 연결 저장 실패:', error);
                    throw new Error('디바이스-센서 연결 저장 중 오류가 발생했습니다: ' + error.message);
                }
            } else {
                console.log('저장할 디바이스-센서 연결 정보가 없습니다.');
            }

            await connection.commit();
            console.log('트랜잭션 커밋 완료');

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
            console.error('[워크플로우 생성] 트랜잭션 내부 오류:', error);
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('[워크플로우 생성] 에러:', error);
        res.status(500).json({
            success: false,
            message: '워크플로우 저장 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};

exports.getUserWorkflows = async (req, res) => {
    const userId = req.user.user_id;
    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'user_id가 필요합니다.'
        });
    }
    try {
        const query = `
            SELECT 
                workflow_id, 
                name, 
                description, 
                created_at, 
                updated_at, 
                is_public, 
                user_id,
                nodes,
                edges
            FROM workflows 
            WHERE user_id = ? 
            ORDER BY updated_at DESC 
            LIMIT 10
        `;

        const [workflows] = await pool.execute(query, [userId]);
        console.log('조회된 워크플로우 수:', workflows.length);
        
        // nodes와 edges가 문자열인 경우 JSON으로 파싱
        const parsedWorkflows = workflows.map(workflow => {
            try {
                if (typeof workflow.nodes === 'string') {
                    workflow.nodes = JSON.parse(workflow.nodes);
                }
                if (typeof workflow.edges === 'string') {
                    workflow.edges = JSON.parse(workflow.edges);
                }
            } catch (error) {
                console.error('JSON 파싱 오류:', error);
                workflow.nodes = workflow.nodes || [];
                workflow.edges = workflow.edges || [];
            }
            return workflow;
        });

        console.log('파싱된 워크플로우 목록:', parsedWorkflows);
        
        res.json({
            success: true,
            workflows: parsedWorkflows || []
        });
    } catch (error) {
        console.error('워크플로우 목록 조회 실패 - 상세 오류:', error);
        res.status(500).json({
            success: false,
            message: '워크플로우 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};

exports.getWorkflowById = async (req, res) => {
    try {
        const { workflowId } = req.params;
        const userId = req.user.user_id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'user_id가 필요합니다.'
            });
        }

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
        let { name, description, nodes, edges, isPublic, deviceSensorLinks } = req.body;
        const userId = req.user.user_id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'user_id가 필요합니다.'
            });
        }

        if (!workflowId) {
            return res.status(400).json({
                success: false,
                message: 'workflow_id가 필요합니다.'
            });
        }

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

        // 엣지 데이터 유효성 검사 및 정규화 (createWorkflow와 동일)
        if (edges && Array.isArray(edges)) {
            const validEdges = edges.filter(edge => {
                return edge.data && 
                       edge.data.id && 
                       edge.data.source && 
                       edge.data.target &&
                       edge.data.source !== edge.data.target;
            });

            if (validEdges.length !== edges.length) {
                console.warn('updateWorkflow: 일부 유효하지 않은 엣지가 제거되었습니다:', {
                    originalCount: edges.length,
                    validCount: validEdges.length
                });
            }

            // 엣지 데이터 정규화
            edges = validEdges.map(edge => ({
                data: {
                    id: edge.data.id,
                    source: edge.data.source,
                    target: edge.data.target,
                    label: edge.data.label || '',
                    type: edge.data.type || 'default'
                }
            }));
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
        console.log('[워크플로우 수정] 쿼리 결과:', { workflowId, userId, affectedRows: result.affectedRows, edges });
        if (result.affectedRows === 0) {
            console.warn('[워크플로우 수정] 실패: 워크플로우를 찾을 수 없거나 수정 권한이 없습니다.', { workflowId, userId });
            return res.status(404).json({
                success: false,
                message: '워크플로우를 찾을 수 없거나 수정 권한이 없습니다.'
            });
        }

        // === device_sensors 연결 정보 저장 ===
        console.log('[디버깅] deviceSensorLinks:', deviceSensorLinks);
        if (deviceSensorLinks && deviceSensorLinks.length > 0) {
            // 기존 연결 삭제 (workflow_id 기준)
            console.log('[디버깅] 기존 device_sensors 삭제 시도, workflowId:', workflowId);
            const [deleteResult] = await pool.execute(
                'DELETE FROM device_sensors WHERE workflow_id = ?',
                [workflowId]
            );
            console.log('[디버깅] 삭제 결과:', deleteResult);
            // 새로운 연결 추가
            const values = deviceSensorLinks.map(link => [
                workflowId,
                link.device_id,
                link.sensor_id,
                JSON.stringify(link.config || {})
            ]);
            console.log('[디버깅] 추가할 values:', values);
            if (values.length > 0) {
                // 디버깅: 쿼리 실행 전 상세 로그
                console.log('[디버깅] deviceSensorLinks:', deviceSensorLinks);
                console.log('[디버깅] values:', values);
                const placeholders = values.map(() => '(?, ?, ?, ?)').join(', ');
                console.log('[디버깅] placeholders:', placeholders);
                const flatValues = values.flat();
                console.log('[디버깅] flatValues:', flatValues);
                const sql = `INSERT INTO device_sensors (workflow_id, device_id, sensor_id, config) VALUES ${placeholders}`;
                console.log('[디버깅] sql:', sql);
                try {
                    const [insertResult] = await pool.execute(sql, flatValues);
                    console.log('[디버깅] insertResult:', insertResult);
                } catch (insertErr) {
                    console.error('[디버깅] INSERT 쿼리 실행 중 에러:', insertErr);
                    console.error('[디버깅] 쿼리:', sql);
                    console.error('[디버깅] 파라미터:', flatValues);
                    throw insertErr;
                }
            }
        } else {
            console.log('[디버깅] 저장할 deviceSensorLinks 없음');
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
        console.error('[워크플로우 수정] 에러:', error);
        res.status(500).json({
            success: false,
            message: '워크플로우 수정 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};

exports.deleteWorkflow = async (req, res) => {
    try {
        const { workflowId } = req.params;
        const userId = req.user.user_id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'user_id가 필요합니다.'
            });
        }

        if (!workflowId) {
            return res.status(400).json({
                success: false,
                message: 'workflow_id가 필요합니다.'
            });
        }

        // 워크플로우 삭제 전 device_sensors 연결도 함께 삭제
        await pool.execute('DELETE FROM device_sensors WHERE workflow_id = ?', [workflowId]);
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

exports.getRecentWorkflows = async (req, res) => {
    try {
        const userId = req.user.user_id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'user_id가 필요합니다.'
            });
        }

        const [workflows] = await pool.execute(
            'SELECT workflow_id, name, description, created_at, updated_at, is_public, user_id, status FROM workflows WHERE user_id = ? ORDER BY updated_at DESC LIMIT 3',
            [userId]
        );

        res.json({
            success: true,
            workflows
        });
    } catch (error) {
        console.error('최근 워크플로우 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '최근 워크플로우 조회 중 오류가 발생했습니다.'
        });
    }
};

exports.saveWorkflow = async (req, res) => {
    const { name, description, nodes, edges, deviceSensorLinks } = req.body;
    const userId = req.user.user_id;

    console.log('워크플로우 저장 요청:', {
        name,
        description,
        nodesCount: nodes?.length,
        edgesCount: edges?.length,
        deviceSensorLinks
    });

    try {
        // 트랜잭션 시작
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. 워크플로우 저장
            const [result] = await connection.query(
                'INSERT INTO workflows (user_id, name, description, nodes, edges) VALUES (?, ?, ?, ?, ?)',
                [userId, name, description, JSON.stringify(nodes), JSON.stringify(edges)]
            );
            const workflowId = result.insertId;
            console.log('워크플로우 저장 성공:', { workflowId });

            // 2. device_sensors 연결 정보 저장
            console.log('[디버깅] deviceSensorLinks:', deviceSensorLinks);
            if (deviceSensorLinks && deviceSensorLinks.length > 0) {
                try {
                    // 기존 연결 삭제 (선택적, workflow_id 기준)
                    console.log('[디버깅] 기존 device_sensors 삭제 시도, workflowId:', workflowId);
                    const [deleteResult] = await connection.query(
                        'DELETE FROM device_sensors WHERE workflow_id = ?',
                        [workflowId]
                    );
                    console.log('[디버깅] 삭제 결과:', deleteResult);

                    // 새로운 연결 추가 (workflow_id 포함)
                    const values = deviceSensorLinks.map(link => [
                        workflowId,
                        link.device_id,
                        link.sensor_id,
                        JSON.stringify(link.config || {})
                    ]);
                    console.log('[디버깅] 추가할 values:', values);

                    if (values.length > 0) {
                        // 디버깅: 쿼리 실행 전 상세 로그
                        console.log('[디버깅] deviceSensorLinks:', deviceSensorLinks);
                        console.log('[디버깅] values:', values);
                        const placeholders = values.map(() => '(?, ?, ?, ?)').join(', ');
                        console.log('[디버깅] placeholders:', placeholders);
                        const flatValues = values.flat();
                        console.log('[디버깅] flatValues:', flatValues);
                        const sql = `INSERT INTO device_sensors (workflow_id, device_id, sensor_id, config) VALUES ${placeholders}`;
                        console.log('[디버깅] sql:', sql);
                        try {
                            const [insertResult] = await connection.execute(sql, flatValues);
                            console.log('[디버깅] insertResult:', insertResult);
                        } catch (insertErr) {
                            console.error('[디버깅] INSERT 쿼리 실행 중 에러:', insertErr);
                            console.error('[디버깅] 쿼리:', sql);
                            console.error('[디버깅] 파라미터:', flatValues);
                            throw insertErr;
                        }
                    }
                } catch (error) {
                    console.error('디바이스-센서 연결 저장 실패:', error);
                    throw new Error('디바이스-센서 연결 저장 중 오류가 발생했습니다: ' + error.message);
                }
            } else {
                console.log('저장할 디바이스-센서 연결 정보가 없습니다.');
            }

            await connection.commit();
            console.log('트랜잭션 커밋 완료');
            
            res.json({ 
                success: true, 
                workflowId,
                message: '워크플로우가 성공적으로 저장되었습니다.'
            });
        } catch (error) {
            console.error('트랜잭션 내부 오류:', error);
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('워크플로우 저장 실패:', error);
        res.status(500).json({ 
            success: false, 
            message: '워크플로우 저장에 실패했습니다.',
            error: error.message 
        });
    }
};