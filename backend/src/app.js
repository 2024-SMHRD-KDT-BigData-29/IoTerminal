const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
const workflowRouter = require('./routes/workflow');

const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 워크플로우 라우트 등록
app.use('/api/workflow', workflowRouter);

// DB 연결 테스트
app.get('/api/test', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    connection.release();
    res.json({ message: 'Database connection successful' });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 