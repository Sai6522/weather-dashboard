const axios = require('axios');
const { format, subDays, addDays } = require('date-fns');

// Simulate the weather API service
class WeatherApiService {
  constructor() {
    this.baseUrl = 'https://archive-api.open-meteo.com/v1/archive';
    this.cache = new Map();
  }

  async fetchWeatherData(latitude, longitude, startDate, endDate) {
    const cacheKey = `${latitude}-${longitude}-${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}`;
    
    if (this.cache.has(cacheKey)) {
      console.log('📦 Using cached data for:', cacheKey);
      return this.cache.get(cacheKey);
    }

    try {
      const params = {
        latitude: latitude.toFixed(4),
        longitude: longitude.toFixed(4),
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        hourly: 'temperature_2m',
        timezone: 'UTC'
      };

      console.log('🌐 API Request:', this.baseUrl);
      console.log('📋 Parameters:', params);

      const response = await axios.get(this.baseUrl, { params });
      const data = response.data;
      
      console.log('✅ API Response received');
      console.log('📊 Data points:', data.hourly?.time?.length || 0);
      
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching weather data:', error.message);
      if (error.response) {
        console.error('📄 Response status:', error.response.status);
        console.error('📄 Response data:', error.response.data);
      }
      return null;
    }
  }

  async getTemperatureForTimeRange(latitude, longitude, startTime, endTime) {
    console.log('\n🎯 Getting temperature for polygon:');
    console.log('📍 Location:', `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    console.log('⏰ Time range:', startTime.toISOString(), 'to', endTime.toISOString());

    // Extend the date range to ensure we have data
    const startDate = subDays(startTime, 1);
    const endDate = addDays(endTime, 1);

    console.log('📅 Extended date range:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));

    const data = await this.fetchWeatherData(latitude, longitude, startDate, endDate);
    
    if (!data || !data.hourly) {
      console.log('❌ No data received from API');
      return null;
    }

    const { time, temperature_2m } = data.hourly;
    
    console.log('🔍 Processing hourly data...');
    console.log('📊 Total time points:', time.length);
    console.log('📊 Total temperature points:', temperature_2m.length);

    // Filter data for the requested time range
    const relevantTemperatures = [];
    
    time.forEach((timeStr, index) => {
      const dataTime = new Date(timeStr);
      if (dataTime >= startTime && dataTime <= endTime) {
        const temp = temperature_2m[index];
        if (temp !== null && temp !== undefined) {
          relevantTemperatures.push(temp);
          console.log(`📈 ${timeStr}: ${temp}°C`);
        }
      }
    });

    console.log('🎯 Relevant temperatures found:', relevantTemperatures.length);

    if (relevantTemperatures.length === 0) {
      console.log('⚠️ No temperatures found in the specified time range');
      
      // Debug: Show some sample data points
      console.log('🔍 Sample data points:');
      time.slice(0, 5).forEach((timeStr, index) => {
        console.log(`   ${timeStr}: ${temperature_2m[index]}°C`);
      });
      
      return null;
    }

    // Return average temperature for the time range
    const avgTemp = relevantTemperatures.reduce((sum, temp) => sum + temp, 0) / relevantTemperatures.length;
    console.log('🌡️ Average temperature:', avgTemp.toFixed(2) + '°C');
    
    return avgTemp;
  }
}

// Test the polygon temperature fetching
async function testPolygonTemperature() {
  console.log('🧪 Testing Polygon Temperature Fetching\n');
  
  const weatherApi = new WeatherApiService();
  
  // Test with Berlin coordinates (similar to your default map center)
  const latitude = 52.5200;
  const longitude = 13.4050;
  
  // Test with current time (single hour mode)
  const now = new Date();
  console.log('🕐 Current time:', now.toISOString());
  
  try {
    const temperature = await weatherApi.getTemperatureForTimeRange(
      latitude,
      longitude,
      now,
      now
    );
    
    console.log('\n🎉 Final Result:');
    if (temperature !== null) {
      console.log('✅ Temperature:', temperature.toFixed(1) + '°C');
    } else {
      console.log('❌ Temperature: N/A');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Test with a range of dates to see what works
async function testDateRanges() {
  console.log('\n🧪 Testing Different Date Ranges\n');
  
  const weatherApi = new WeatherApiService();
  const latitude = 52.5200;
  const longitude = 13.4050;
  
  const testDates = [
    { name: 'Today', date: new Date() },
    { name: 'Yesterday', date: subDays(new Date(), 1) },
    { name: '2 days ago', date: subDays(new Date(), 2) },
    { name: '1 week ago', date: subDays(new Date(), 7) },
    { name: '1 month ago', date: subDays(new Date(), 30) }
  ];
  
  for (const test of testDates) {
    console.log(`\n📅 Testing ${test.name} (${format(test.date, 'yyyy-MM-dd')}):`);
    
    try {
      const temperature = await weatherApi.getTemperatureForTimeRange(
        latitude,
        longitude,
        test.date,
        test.date
      );
      
      if (temperature !== null) {
        console.log(`✅ ${test.name}: ${temperature.toFixed(1)}°C`);
      } else {
        console.log(`❌ ${test.name}: N/A`);
      }
    } catch (error) {
      console.log(`💥 ${test.name}: Error - ${error.message}`);
    }
  }
}

// Run the tests
async function runTests() {
  await testPolygonTemperature();
  await testDateRanges();
}

runTests().catch(console.error);
