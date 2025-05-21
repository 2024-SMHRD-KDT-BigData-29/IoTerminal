const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'project-db-campus.smhrd.com',
  port: 3312,
  user: 'mp_24K_bigdata29_p3_1',
  password: 'smhrd1',
  database: 'mp_24K_bigdata29_p3_1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool; 