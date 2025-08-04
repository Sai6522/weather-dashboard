const axios = require('axios');

async function testOpenMeteoAPI() {
  try {
    console.log('Testing Open-Meteo API...');
    
    const response = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
      params: {
        latitude: 52.52,
        longitude: 13.41,
        start_date: '2025-08-01',
        end_date: '2025-08-02',
        hourly: 'temperature_2m',
        timezone: 'UTC'
      }
    });
    
    console.log('✅ API Response received successfully!');
    console.log('📍 Location:', response.data.latitude, response.data.longitude);
    console.log('🌡️  Temperature data points:', response.data.hourly.temperature_2m.length);
    console.log('📊 Sample temperatures:', response.data.hourly.temperature_2m.slice(0, 5));
    console.log('⏰ Sample times:', response.data.hourly.time.slice(0, 5));
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testOpenMeteoAPI();
