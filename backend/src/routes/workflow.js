const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// 워크플로우 저장
router.post('/save', async (req, res) => {
  try {
    const { name, description, nodes, edges, userId, isPublic } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO workflows (name, description, nodes, edges, user_id, is_public) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, JSON.stringify(nodes), JSON.stringify(edges), userId, isPublic]
    );

    res.json({ 
      success: true, 
      workflowId: result.insertId,
      message: '워크플로우가 저장되었습니다.'
    });
  } catch (error) {
    console.error('워크플로우 저장 실패:', error, req.body);
    res.status(500).json({ 
      success: false, 
      error: '워크플로우 저장에 실패했습니다.' 
    });
  }
});

// 워크플로우 목록 조회
router.get('/list', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const [workflows] = await pool.execute(
      'SELECT id, name, description, created_at, updated_at, is_public FROM workflows WHERE user_id = ? OR is_public = true ORDER BY updated_at DESC',
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
      error: '워크플로우 목록 조회에 실패했습니다.' 
    });
  }
});

// 워크플로우 불러오기
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [workflows] = await pool.execute(
      'SELECT * FROM workflows WHERE id = ?',
      [id]
    );

    if (workflows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: '워크플로우를 찾을 수 없습니다.' 
      });
    }

    const workflow = workflows[0];
    workflow.nodes = JSON.parse(workflow.nodes);
    workflow.edges = JSON.parse(workflow.edges);

    res.json({ 
      success: true, 
      workflow 
    });
  } catch (error) {
    console.error('워크플로우 불러오기 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '워크플로우 불러오기에 실패했습니다.' 
    });
  }
});

// 워크플로우 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute(
      'DELETE FROM workflows WHERE id = ?',
      [id]
    );

    res.json({ 
      success: true, 
      message: '워크플로우가 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('워크플로우 삭제 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '워크플로우 삭제에 실패했습니다.' 
    });
  }
});

module.exports = router; 