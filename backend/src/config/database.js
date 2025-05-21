const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'project-db-campus.smhrd.com',
    port: 3312,
    user: 'mp_24K_bigdata29_p3_1',  // MySQL 사용자 이름
    password: 'smhrd1',  // MySQL 비밀번호
    database: 'mp_24K_bigdata29_p3_1',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000, // 60초
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// 설정이 제대로 적용되었는지 확인
console.log('Database configuration loaded:', {
    host: pool.pool.config.connectionConfig.host,
    port: pool.pool.config.connectionConfig.port,
    user: pool.pool.config.connectionConfig.user,
    database: pool.pool.config.connectionConfig.database
});

module.exports = pool; 