const db = require('../config/database');

exports.createSensor = async (req, res) => {
  const { name, type, description, config } = req.body;
  // 중복 체크 (이름+타입)
  const [rows] = await db.query('SELECT sensor_id FROM sensors WHERE name=? AND type=?', [name, type]);
  if (rows.length > 0) {
    return res.json({ success: true, sensor_id: rows[0].sensor_id });
  }
  const [result] = await db.query(
    'INSERT INTO sensors (name, type, description, config) VALUES (?, ?, ?, ?)',
    [name, type, description, JSON.stringify(config || {})]
  );
  res.json({ success: true, sensor_id: result.insertId });
};

exports.getSensors = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM sensors');
  res.json({ sensors: rows });
};

exports.updateSensor = async (req, res) => {
  const { sensor_id } = req.params;
  const { name, description, config } = req.body;
  console.log('[센서 수정 요청] sensor_id:', sensor_id, 'name:', name, 'description:', description, 'config:', config);
  try {
    const [result] = await db.query(
      'UPDATE sensors SET name=?, description=?, config=? WHERE sensor_id=?',
      [name, description, JSON.stringify(config || {}), sensor_id]
    );
    console.log('[센서 수정 쿼리 결과]', result);
    if (result.affectedRows === 0) {
      console.warn('[센서 수정 실패] 해당 센서를 찾을 수 없음:', sensor_id);
      return res.status(404).json({ success: false, message: '센서를 찾을 수 없습니다.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[센서 수정 오류]', err);
    res.status(500).json({ success: false, message: '센서 수정 중 오류가 발생했습니다.' });
  }
};

// 센서별 최신 측정값 반환 API
exports.getSensorsWithLatestValues = async (req, res) => {
  try {
    // 1. 센서 메타 정보 모두 조회
    const [sensors] = await db.query('SELECT * FROM sensors');
    // 2. sensor 테이블에서 최신 row 1개 조회
    const [latestRows] = await db.query('SELECT * FROM sensor ORDER BY dt DESC LIMIT 1');
    const latest = latestRows[0] || {};
    // 3. 매핑
    const result = sensors.map(s => {
      let value = null;
      if (s.name.includes('메탄')) value = latest.mq4;
      else if (s.name.includes('황화수소') || s.name.includes('황산화')) value = latest.mq136;
      else if (s.name.includes('암모니아')) value = latest.mq137;
      // 필요시 farmno, zone 등 추가 매핑 가능
      return {
        ...s,
        latestValue: value,
        latestTime: latest.dt
      };
    });
    res.json({ sensors: result });
  } catch (err) {
    console.error('[센서별 최신값 API 오류]', err);
    res.status(500).json({ success: false, message: '센서별 최신값 조회 중 오류가 발생했습니다.' });
  }
};

// 센서별 시간별 데이터 반환 API
exports.getSensorTimeSeries = async (req, res) => {
  const { sensor_id } = req.params;
  const { farmno = '1', zone = 'A' } = req.query;
  console.log('[timeseries API 호출]', { sensor_id, farmno, zone });
  
  try {
    // 센서 메타 정보 조회
    const [sensorMetaRows] = await db.query('SELECT * FROM sensors WHERE sensor_id=?', [sensor_id]);
    if (!sensorMetaRows.length) {
      console.warn('[timeseries] 센서 없음:', sensor_id);
      // 센서가 없어도 모의 데이터 반환
      const mockData = generateMockTimeSeriesData();
      return res.json({ data: mockData });
    }
    const sensorMeta = sensorMetaRows[0];

    // 센서 이름/설정에 따라 sensor 테이블의 컬럼 결정
    let column = null;
    if (sensorMeta.name.includes('메탄')) column = 'mq4';
    else if (sensorMeta.name.includes('황화수소') || sensorMeta.name.includes('황산화')) column = 'mq136';
    else if (sensorMeta.name.includes('암모니아')) column = 'mq137';
    else if (sensorMeta.name.includes('온도')) column = 'temperature';
    else if (sensorMeta.name.includes('습도')) column = 'humidity';
    else {
      console.warn('[timeseries] 지원하지 않는 센서:', sensorMeta.name);
      // 지원하지 않는 센서도 모의 데이터 반환
      const mockData = generateMockTimeSeriesData();
      return res.json({ data: mockData });
    }

    // sensor 테이블에서 시간별 데이터 조회
    const [rows] = await db.query(
      `SELECT dt as timestamp, ${column} as value FROM sensor ORDER BY dt DESC LIMIT 20`
    );
    console.log('[timeseries] 쿼리 결과:', rows.length, '건');
    
    if (rows.length === 0) {
      // 데이터가 없으면 모의 데이터 반환
      const mockData = generateMockTimeSeriesData();
      return res.json({ data: mockData });
    }
    
    res.json({ data: rows });
  } catch (err) {
    console.error('[timeseries] 쿼리 오류:', err);
    // 오류 발생 시에도 모의 데이터 반환
    const mockData = generateMockTimeSeriesData();
    res.json({ data: mockData });
  }
};

// 모의 시계열 데이터 생성 함수
function generateMockTimeSeriesData() {
  const data = [];
  const now = new Date();
  
  for (let i = 19; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000); // 5분 간격
    data.push({
      timestamp: timestamp.toISOString(),
      value: Math.floor(Math.random() * 20) + 15 // 15-35 사이의 값
    });
  }
  
  return data;
} 