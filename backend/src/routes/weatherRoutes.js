const express = require('express');
const router = express.Router();
const https = require('https');

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// 격자 좌표 변환 함수 (서울시청 고정)
function convertToGridCoordinates(lat, lon) {
    // 실제 변환 필요시 구현, 여기선 서울시청 고정
    return { x: 60, y: 127 };
}

router.get('/current', async (req, res) => {
    try {
        const lat = req.query.lat || 37.5665;  // 서울 위도
        const lon = req.query.lon || 126.9780; // 서울 경도

        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?` +
            `lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=kr`;

        // API 요청 정보 로깅
        console.log('OpenWeather API 요청 정보:', {
            lat,
            lon,
            apiUrl: apiUrl.replace(OPENWEATHER_API_KEY, 'HIDDEN_KEY')
        });

        https.get(apiUrl, (response) => {
            let data = '';
            response.on('data', (chunk) => { data += chunk; });
            response.on('end', () => {
                try {
                    console.log('OpenWeather API 응답:', data);
                    
                    const parsed = JSON.parse(data);
                    if (parsed.cod !== 200) {
                        throw new Error(parsed.message || '날씨 정보를 가져오는데 실패했습니다.');
                    }

                    const weatherData = {
                        temperature: parsed.main.temp,
                        humidity: parsed.main.humidity,
                        windSpeed: parsed.wind.speed,
                        description: parsed.weather[0].description,
                        icon: parsed.weather[0].icon,
                        city: parsed.name,
                        timestamp: new Date().toISOString()
                    };

                    res.json({ 
                        success: true, 
                        data: weatherData
                    });
                } catch (error) {
                    console.error('날씨 데이터 파싱 오류:', error);
                    res.status(500).json({
                        success: false,
                        message: '날씨 데이터 처리 중 오류가 발생했습니다.',
                        error: error.message
                    });
                }
            });
        }).on('error', (error) => {
            console.error('OpenWeather API 요청 오류:', error);
            res.status(500).json({
                success: false,
                message: '날씨 API 요청 중 오류가 발생했습니다.',
                error: error.message
            });
        });
    } catch (error) {
        console.error('날씨 정보 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '날씨 정보를 가져오는데 실패했습니다.',
            error: error.message
        });
    }
});

module.exports = router; 