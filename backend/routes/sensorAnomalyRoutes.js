const express = require('express');
const router = express.Router();

// 알림 통계 조회
router.get('/stats', async (req, res) => {
    try {
        const { period = '7d' } = req.query;
        
        let dateCondition = '';
        switch (period) {
            case '1d':
                dateCondition = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)';
                break;
            case '7d':
                dateCondition = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                break;
            case '30d':
                dateCondition = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
                break;
            default:
                dateCondition = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        }

        // 전체 통계
        const [totalStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_alerts,
                COUNT(CASE WHEN is_resolved = 0 THEN 1 END) as unresolved_alerts,
                COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_alerts,
                COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_alerts,
                COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_alerts,
                COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_alerts
            FROM sensor_anomaly_alerts 
            ${dateCondition}
        `);

        // 센서별 통계
        const [sensorStats] = await db.execute(`
            SELECT 
                sensor_type,
                sensor_name,
                COUNT(*) as alert_count,
                COUNT(CASE WHEN is_resolved = 0 THEN 1 END) as unresolved_count,
                COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count
            FROM sensor_anomaly_alerts 
            ${dateCondition}
            GROUP BY sensor_type, sensor_name
            ORDER BY alert_count DESC
        `);

        // 일별 알림 수 (최근 7일)
        const [dailyStats] = await db.execute(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as alert_count,
                COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count
            FROM sensor_anomaly_alerts 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        // 알림 타입별 통계
        const [typeStats] = await db.execute(`
            SELECT 
                alert_type,
                COUNT(*) as count,
                COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count
            FROM sensor_anomaly_alerts 
            ${dateCondition}
            GROUP BY alert_type
            ORDER BY count DESC
        `);

        res.json({
            success: true,
            data: {
                total: totalStats[0],
                by_sensor: sensorStats,
                daily: dailyStats,
                by_type: typeStats,
                period: period
            }
        });
    } catch (error) {
        console.error('알림 통계 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '알림 통계 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router; 