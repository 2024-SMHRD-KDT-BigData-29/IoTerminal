const express = require('express');
const router = express.Router();
const pool = require('../config/database'); // DB 커넥션 풀

// 워크플로우 저장
router.post('/save', async (req, res) => {
  try {
    const { name, description, nodes, edges, userId, isPublic } = req.body;

    // 필수 값 검증 (예: name과 userId는 반드시 있어야 한다고 가정)
    if (name === undefined || userId === undefined) {
      return res.status(400).json({
        success: false,
        error: '필수 항목(워크플로우 이름, 사용자 ID)이 누락되었습니다.'
      });
    }

    // isPublic 값이 undefined일 경우 기본값 false로 설정
    const isPublicValue = isPublic !== undefined ? isPublic : false;
    // description이 undefined일 경우 DB에 NULL로 저장되도록 JavaScript null 사용
    const descriptionValue = description !== undefined ? description : null;
    // nodes나 edges가 undefined일 경우 빈 배열로 처리 후 JSON 문자열로 변환
    const nodesString = JSON.stringify(nodes || []);
    const edgesString = JSON.stringify(edges || []);
    
    const [result] = await pool.execute(
      'INSERT INTO workflows (name, description, nodes, edges, user_id, is_public) VALUES (?, ?, ?, ?, ?, ?)',
      [name, descriptionValue, nodesString, edgesString, userId, isPublicValue]
    );

    res.status(201).json({ // 성공 시 201 Created 상태 코드 사용 권장
      success: true,
      workflowId: result.insertId,
      message: '워크플로우가 성공적으로 저장되었습니다.'
    });
  } catch (error) {
    console.error('워크플로우 저장 실패:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: '워크플로우 저장 중 서버 오류가 발생했습니다.'
    });
  }
});

// 워크플로우 목록 조회 (오류 수정 적용된 부분)
router.get('/list', async (req, res) => {
  try {
    const userIdFromQuery = req.query.userId;

    // userIdFromQuery가 undefined이면 JavaScript null로 변경
    const userIdForQuery = userIdFromQuery !== undefined ? userIdFromQuery : null;

    // 디버깅을 위한 로그 (어떤 userId 값으로 쿼리하는지 확인)
    console.log(`[Workflow List] Fetching workflows. Filter userId: ${userIdForQuery === null ? 'NULL (public/unassigned)' : userIdForQuery}`);

    const [workflows] = await pool.execute(
      'SELECT id, name, description, created_at, updated_at, is_public FROM workflows WHERE user_id = ? OR is_public = true ORDER BY updated_at DESC',
      [userIdForQuery] // 수정된 userIdForQuery 사용
    );

    res.json({
      success: true,
      workflows
    });
  } catch (error) {
    // 오류 로깅 개선: 어떤 userId 쿼리 파라미터로 요청왔었는지, SQL 에러 메시지(있다면) 포함
    console.error(`워크플로우 목록 조회 실패 (Request Query userId: ${req.query.userId}):`, 
                  error.message, 
                  error.sqlMessage ? `SQL Error: ${error.sqlMessage}` : '', 
                  error.stack);
    res.status(500).json({
      success: false,
      error: '워크플로우 목록 조회 중 서버 오류가 발생했습니다.'
    });
  }
});

// 특정 워크플로우 불러오기
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // id 파라미터 유효성 검사 (숫자인지)
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: '유효한 워크플로우 ID가 필요합니다. 숫자 형식이어야 합니다.'
      });
    }

    const [workflows] = await pool.execute(
      'SELECT * FROM workflows WHERE id = ?',
      [parseInt(id)] // id를 숫자로 변환하여 전달
    );

    if (workflows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '해당 ID의 워크플로우를 찾을 수 없습니다.'
      });
    }

    const workflow = workflows[0];

    // DB에서 가져온 nodes, edges (JSON 문자열)를 JavaScript 객체로 파싱
    // 만약 DB에 NULL로 저장되어 있거나, 유효하지 않은 JSON 문자열일 경우를 대비하여 안전하게 처리
    try {
      workflow.nodes = workflow.nodes ? JSON.parse(workflow.nodes) : [];
      workflow.edges = workflow.edges ? JSON.parse(workflow.edges) : [];
    } catch (parseError) {
      console.error(`워크플로우 ID ${id}의 데이터(nodes/edges) JSON 파싱 실패:`, parseError.message);
      // 파싱 실패 시 클라이언트에 오류를 알리거나, 빈 배열로 대체한 현재 상태를 유지할 수 있음
      // 여기서는 일단 빈 배열로 대체하지만, 더 엄격하게 오류 처리할 수도 있음
      return res.status(500).json({
          success: false,
          error: '워크플로우 데이터 형식에 오류가 있어 불러올 수 없습니다.'
      });
    }

    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('워크플로우 불러오기 실패:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: '워크플로우 불러오기 중 서버 오류가 발생했습니다.'
    });
  }
});

// 워크플로우 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // id 파라미터 유효성 검사
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: '유효한 워크플로우 ID가 필요합니다. 숫자 형식이어야 합니다.'
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM workflows WHERE id = ?',
      [parseInt(id)] // id를 숫자로 변환하여 전달
    );

    // 실제로 삭제된 행이 있는지 확인
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '삭제할 워크플로우를 찾을 수 없거나 이미 삭제되었습니다.'
      });
    }

    res.json({
      success: true,
      message: '워크플로우가 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('워크플로우 삭제 실패:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: '워크플로우 삭제 중 서버 오류가 발생했습니다.'
    });
  }
});

module.exports = router;