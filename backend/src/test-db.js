require('dotenv').config(); // <--- 이 줄을 추가하세요!

const path = require('path');
console.log('Current directory:', __dirname);
console.log('Looking for database.js at:', path.join(__dirname, 'config', 'database.js'));

const pool = require(path.join(__dirname, 'config', 'database'));
console.log('Database configuration:', {
    host: pool.pool.config.connectionConfig.host,
    user: pool.pool.config.connectionConfig.user,
    database: pool.pool.config.connectionConfig.database
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('데이터베이스 연결 성공!');
        connection.release();
    } catch (error) {
        console.error('데이터베이스 연결 실패:', error);
    }
}

testConnection(); 