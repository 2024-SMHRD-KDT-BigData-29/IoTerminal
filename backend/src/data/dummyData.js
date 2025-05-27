// File: backend/src/data/dummyData.js
// In-memory store for mockup purposes

let users = [
    { id: 'user1', username: '김유진', passwordHash: '$2a$10$...', role: 'PM', email: 'pm@example.com' }, // Store hashed passwords in a real app
    { id: 'user2', username: '손지수', passwordHash: '$2a$10$...', role: 'Front-end Developer', email: 'frontend@example.com' }
];

// Pre-populate with some workflow data to show in the UI
let workflows = [
    {
        id: 'wf1',
        userId: 'user1', // Associated with '김유진'
        name: '온도 모니터링 및 알림',
        elements: [ // Example Cytoscape elements
            { group: 'nodes', data: { id: 'input_temp', label: 'Temperature Sensor', type: 'Input', config: { sensorId: 'DHT11-01' } }, position: { x: 100, y: 100 } },
            { group: 'nodes', data: { id: 'process_check', label: 'Check Threshold', type: 'Condition', config: { conditionField: 'temperature', operator: '>', compareValue: '30' } }, position: { x: 300, y: 100 } },
            { group: 'nodes', data: { id: 'output_alert', label: 'Send Alert', type: 'Output', config: { outputType: 'notification', recipient: 'admin@example.com' } }, position: { x: 500, y: 100 } },
            { group: 'edges', data: { id: 'e1', source: 'input_temp', target: 'process_check' } },
            { group: 'edges', data: { id: 'e2', source: 'process_check', target: 'output_alert' } }
        ],
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(), // 1 hour ago
        updatedAt: new Date(Date.now() - 3600000 * 1).toISOString()
    },
    {
        id: 'wf2',
        userId: 'user1',
        name: '생산 데이터 수집',
        elements: [
            { group: 'nodes', data: { id: 'input_machine', label: 'Machine Sensor', type: 'Input', config: { sensorId: 'MC-002' } }, position: { x: 100, y: 200 } },
            { group: 'nodes', data: { id: 'output_db', label: 'Save to Production DB', type: 'Output', config: { outputType: 'database', connection: 'prod_db_string' } }, position: { x: 300, y: 200 } },
            { group: 'edges', data: { id: 'e3', source: 'input_machine', target: 'output_db' } }
        ],
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
    }
];

// Simulate active sensors for dashboard summary cards
const summaryStats = {
    activeSensors: 8,
    dataCollected: "128", // as a string
    errorRate: "2.4%",    // as a string
    apiCalls: "25K"       // as a string
};

// Simulate sensor status for the dashboard
const sensorStatusData = [
    { name: "온도 센서 (DHT11)", status: "정상", value: "23.5°C", icon: "Thermometer" },
    { name: "습도 센서 (DHT11)", status: "정상", value: "45%", icon: "Droplet" },
    { name: "전류 센서 (ACS712)", status: "주의", value: "2.4A", icon: "Zap" },
    { name: "압력 센서 (BMP180)", status: "오류", value: "--", icon: "Wind" },
    { name: "가스 센서 (MQ-2)", status: "정상", value: "412ppm", icon: "AlertTriangle" } // Using AlertTriangle for gas for variety
];

// Simulate recent workflows for the dashboard
const recentWorkflowsDashboard = [
    { name: "온도 모니터링 및 알림", time: "10분 전", status: "실행 중", statusColor: "green" },
    { name: "생산 데이터 수집", time: "1시간 전", status: "실행 중", statusColor: "green" },
    { name: "재고 알림 자동화", time: "3시간 전", status: "일시 중지", statusColor: "yellow" },
    { name: "전력 소비 분석", time: "어제", status: "오류", statusColor: "red" }
];

// Simulate API integration status for the dashboard
const apiIntegrationStatus = [
    { name: "네이버 클라우드", status: "연결됨", statusColor: "green", calls: "2.3K" },
    { name: "카카오톡 알림", status: "연결됨", statusColor: "green", calls: "847" },
    { name: "토스 결제", status: "인증 필요", statusColor: "yellow", calls: "0" },
    { name: "공공 데이터 포털", status: "연결됨", statusColor: "green", calls: "1.1K" }
];


module.exports = {
    users,
    workflows,
    summaryStats,
    sensorStatusData,
    recentWorkflowsDashboard,
    apiIntegrationStatus
};