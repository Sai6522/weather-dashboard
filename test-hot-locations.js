const axios = require('axios');
const { format, subDays } = require('date-fns');

// Test hot weather locations to find red polygons (≥ 35°C)
class HotLocationTester {
  constructor() {
    this.baseUrl = 'https://archive-api.open-meteo.com/v1/archive';
  }

  async testLocation(name, latitude, longitude) {
    try {
      // Test multiple recent dates to find hot weather
      const testDates = [];
      for (let i = 1; i <= 30; i++) {
        testDates.push(subDays(new Date(), i));
      }

      let maxTemp = -999;
      let hotDate = null;

      console.log(`\n🌍 Testing ${name} (${latitude.toFixed(2)}, ${longitude.toFixed(2)}):`);

      // Test recent dates to find the hottest
      for (let i = 0; i < Math.min(testDates.length, 10); i++) {
        const testDate = testDates[i];
        
        const params = {
          latitude: latitude.toFixed(4),
          longitude: longitude.toFixed(4),
          start_date: format(testDate, 'yyyy-MM-dd'),
          end_date: format(testDate, 'yyyy-MM-dd'),
          hourly: 'temperature_2m',
          timezone: 'UTC'
        };

        try {
          const response = await axios.get(this.baseUrl, { params });
          const data = response.data;
          
          if (data.hourly && data.hourly.temperature_2m) {
            const temps = data.hourly.temperature_2m.filter(t => t !== null);
            if (temps.length > 0) {
              const dayMax = Math.max(...temps);
              if (dayMax > maxTemp) {
                maxTemp = dayMax;
                hotDate = testDate;
              }
            }
          }
        } catch (error) {
          // Skip failed requests
        }
      }

      const isRed = maxTemp >= 35;
      const colorEmoji = isRed ? '🔴' : maxTemp >= 25 ? '🟡' : maxTemp >= 10 ? '🟢' : '🔵';
      
      console.log(`${colorEmoji} Max Temperature: ${maxTemp.toFixed(1)}°C`);
      if (hotDate) {
        console.log(`📅 Hottest Date: ${format(hotDate, 'yyyy-MM-dd')}`);
      }
      
      if (isRed) {
        console.log(`🎯 RED POLYGON LOCATION FOUND! Create polygon here for red color.`);
      }

      return {
        name,
        latitude,
        longitude,
        maxTemp,
        hotDate,
        isRed,
        color: isRed ? 'red' : maxTemp >= 25 ? 'yellow' : maxTemp >= 10 ? 'green' : 'blue'
      };

    } catch (error) {
      console.log(`❌ ${name}: Error - ${error.message}`);
      return { name, error: error.message };
    }
  }
}

async function findHotLocations() {
  console.log('🔍 Searching for Hot Weather Locations (≥ 35°C for Red Polygons)\n');
  
  const tester = new HotLocationTester();
  
  // Test various hot climate locations
  const hotLocations = [
    { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
    { name: 'Phoenix, Arizona', lat: 33.4484, lng: -112.0740 },
    { name: 'Riyadh, Saudi Arabia', lat: 24.7136, lng: 46.6753 },
    { name: 'Kuwait City', lat: 29.3759, lng: 47.9774 },
    { name: 'Las Vegas, Nevada', lat: 36.1699, lng: -115.1398 },
    { name: 'Death Valley, CA', lat: 36.5323, lng: -116.9325 },
    { name: 'Baghdad, Iraq', lat: 33.3152, lng: 44.3661 },
    { name: 'Delhi, India', lat: 28.6139, lng: 77.2090 },
    { name: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357 },
    { name: 'Doha, Qatar', lat: 25.2854, lng: 51.5310 },
    { name: 'Tucson, Arizona', lat: 32.2226, lng: -110.9747 },
    { name: 'Alice Springs, Australia', lat: -23.6980, lng: 133.8807 }
  ];

  const results = [];
  
  for (const location of hotLocations) {
    const result = await tester.testLocation(location.name, location.lat, location.lng);
    results.push(result);
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n📊 SUMMARY - Best Locations for Red Polygons:');
  console.log('=' .repeat(60));
  
  const redLocations = results.filter(r => r.isRed);
  const hotLocations2 = results.filter(r => r.maxTemp >= 30 && !r.isRed);
  
  if (redLocations.length > 0) {
    console.log('\n🔴 RED POLYGON LOCATIONS (≥ 35°C):');
    redLocations.forEach(loc => {
      console.log(`✅ ${loc.name}: ${loc.maxTemp.toFixed(1)}°C`);
      console.log(`   📍 Coordinates: ${loc.latitude}, ${loc.longitude}`);
      console.log(`   📅 Date: ${format(loc.hotDate, 'yyyy-MM-dd')}`);
    });
  } else {
    console.log('\n⚠️ No locations found with ≥ 35°C in recent data');
  }

  if (hotLocations2.length > 0) {
    console.log('\n🟡 WARM LOCATIONS (30-34°C) - Close to Red:');
    hotLocations2.forEach(loc => {
      console.log(`🌡️ ${loc.name}: ${loc.maxTemp.toFixed(1)}°C`);
    });
  }

  console.log('\n🎯 INSTRUCTIONS:');
  console.log('1. Navigate your map to one of the red locations above');
  console.log('2. Create a polygon in that area');
  console.log('3. Set the timeline to the hottest date shown');
  console.log('4. The polygon should appear RED with temperature ≥ 35°C');
  
  return results;
}

// Run the test
findHotLocations().catch(console.error);
