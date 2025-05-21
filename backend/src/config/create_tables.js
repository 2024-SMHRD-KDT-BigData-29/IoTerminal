const pool = require('./database');
const fs = require('fs');
const path = require('path');

async function createTables() {
    try {
        // SQL 파일 읽기
        const sqlPath = path.join(__dirname, 'create_user_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // 테이블 생성
        const connection = await pool.getConnection();
        await connection.query(sql);
        connection.release();

        console.log('User 테이블이 성공적으로 생성되었습니다.');
    } catch (error) {
        console.error('테이블 생성 중 오류 발생:', error);
    } finally {
        // 연결 풀 종료
        await pool.end();
    }
}

// 테이블 생성 실행
createTables(); 