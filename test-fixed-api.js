const axios = require('axios');
const { format, subDays, addDays, isAfter, startOfDay, endOfDay } = require('date-fns');

// Fixed weather API service
class WeatherApiService {
  constructor() {
    this.baseUrl = 'https://archive-api.open-meteo.com/v1/archive';
    this.cache = new Map();
  }

  getMaxAvailableDate() {
    const today = new Date();
    return subDays(today, 1); // Yesterday
  }

  async fetchWeatherData(latitude, longitude, startDate, endDate) {
    // Ensure dates are within available range
    const maxDate = this.getMaxAvailableDate();
    const adjustedStartDate = isAfter(startDate, maxDate) ? maxDate : startDate;
    const adjustedEndDate = isAfter(endDate, maxDate) ? maxDate : endDate;

    const cacheKey = `${latitude}-${longitude}-${format(adjustedStartDate, 'yyyy-MM-dd')}-${format(adjustedEndDate, 'yyyy-MM-dd')}`;
    
    if (this.cache.has(cacheKey)) {
      console.log('📦 Using cached data');
      return this.cache.get(cacheKey);
    }

    try {
      const params = {
        latitude: latitude.toFixed(4),
        longitude: longitude.toFixed(4),
        start_date: format(adjustedStartDate, 'yyyy-MM-dd'),
        end_date: format(adjustedEndDate, 'yyyy-MM-dd'),
        hourly: 'temperature_2m',
        timezone: 'UTC'
      };

      console.log('🌐 API Request:', params);

      const response = await axios.get(this.baseUrl, { params });
      const data = response.data;
      
      console.log('✅ API Response received');
      console.log('📊 Data points:', data.hourly?.time?.length || 0);
      
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching weather data:', error.message);
      return null;
    }
  }

  async getTemperatureForTimeRange(latitude, longitude, startTime, endTime) {
    console.log('\n🎯 Getting temperature for polygon:');
    console.log('📍 Location:', `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    console.log('⏰ Time range:', startTime.toISOString(), 'to', endTime.toISOString());

    // For current/future dates, use the most recent available data
    const maxDate = this.getMaxAvailableDate();
    let adjustedStartTime = startTime;
    let adjustedEndTime = endTime;

    if (isAfter(startTime, maxDate)) {
      adjustedStartTime = startOfDay(maxDate);
      adjustedEndTime = endOfDay(maxDate);
      console.log('📅 Using most recent available data instead of future date');
    } else if (isAfter(endTime, maxDate)) {
      adjustedEndTime = endOfDay(maxDate);
    }

    // Extend the date range to ensure we have data
    const startDate = subDays(startOfDay(adjustedStartTime), 1);
    const endDate = addDays(endOfDay(adjustedEndTime), 1);

    const data = await this.fetchWeatherData(latitude, longitude, startDate, endDate);
    
    if (!data || !data.hourly) {
      console.log('❌ No data received from API');
      return null;
    }

    const { time, temperature_2m } = data.hourly;
    
    // More flexible time matching - check if data time is within the day
    const relevantTemperatures = [];
    
    time.forEach((timeStr, index) => {
      const dataTime = new Date(timeStr);
      const temp = temperature_2m[index];
      
      const dataDay = format(dataTime, 'yyyy-MM-dd');
      const startDay = format(adjustedStartTime, 'yyyy-MM-dd');
      const endDay = format(adjustedEndTime, 'yyyy-MM-dd');
      
      if (dataDay >= startDay && dataDay <= endDay && temp !== null && temp !== undefined) {
        relevantTemperatures.push(temp);
      }
    });

    console.log('📊 Found', relevantTemperatures.length, 'temperature readings');

    if (relevantTemperatures.length === 0) {
      // Fallback: try to get any temperature from the available data
      const validTemperatures = temperature_2m.filter(temp => temp !== null && temp !== undefined);
      if (validTemperatures.length > 0) {
        const fallbackTemp = validTemperatures[Math.floor(validTemperatures.length / 2)];
        console.log('🔄 Using fallback temperature:', fallbackTemp);
        return fallbackTemp;
      }
      return null;
    }

    // Return average temperature for the time range
    const avgTemp = relevantTemperatures.reduce((sum, temp) => sum + temp, 0) / relevantTemperatures.length;
    console.log('🌡️ Average temperature:', avgTemp.toFixed(1) + '°C');
    
    return avgTemp;
  }

  async getSimpleTemperature(latitude, longitude) {
    const maxDate = this.getMaxAvailableDate();
    const startDate = subDays(maxDate, 2);
    const endDate = maxDate;

    const data = await this.fetchWeatherData(latitude, longitude, startDate, endDate);
    
    if (!data || !data.hourly || !data.hourly.temperature_2m) {
      return null;
    }

    // Get the most recent valid temperature
    const temperatures = data.hourly.temperature_2m.filter(temp => temp !== null && temp !== undefined);
    if (temperatures.length === 0) {
      return null;
    }

    return temperatures[temperatures.length - 1];
  }
}

// Test the fixed API
async function testFixedAPI() {
  console.log('🧪 Testing Fixed Weather API\n');
  
  const weatherApi = new WeatherApiService();
  
  // Test locations
  const locations = [
    { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'London', lat: 51.5074, lng: -0.1278 }
  ];

  console.log('📅 Max available date:', weatherApi.getMaxAvailableDate().toISOString());
  console.log();

  for (const location of locations) {
    console.log(`\n🌍 Testing ${location.name}:`);
    
    // Test 1: Simple temperature
    try {
      const simpleTemp = await weatherApi.getSimpleTemperature(location.lat, location.lng);
      console.log(`✅ Simple temperature: ${simpleTemp ? simpleTemp.toFixed(1) + '°C' : 'N/A'}`);
    } catch (error) {
      console.log(`❌ Simple temperature failed: ${error.message}`);
    }

    // Test 2: Yesterday's temperature
    const yesterday = subDays(new Date(), 1);
    try {
      const yesterdayTemp = await weatherApi.getTemperatureForTimeRange(
        location.lat, 
        location.lng, 
        yesterday, 
        yesterday
      );
      console.log(`✅ Yesterday's temperature: ${yesterdayTemp ? yesterdayTemp.toFixed(1) + '°C' : 'N/A'}`);
    } catch (error) {
      console.log(`❌ Yesterday's temperature failed: ${error.message}`);
    }

    // Test 3: Current time (should fallback to yesterday)
    const now = new Date();
    try {
      const currentTemp = await weatherApi.getTemperatureForTimeRange(
        location.lat, 
        location.lng, 
        now, 
        now
      );
      console.log(`✅ Current time (fallback): ${currentTemp ? currentTemp.toFixed(1) + '°C' : 'N/A'}`);
    } catch (error) {
      console.log(`❌ Current time failed: ${error.message}`);
    }
  }
}

testFixedAPI().catch(console.error);
