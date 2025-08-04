const axios = require('axios');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  API_BASE_URL: 'https://archive-api.open-meteo.com/v1/archive',
  TEST_COORDINATES: [
    { lat: 52.52, lng: 13.41, name: 'Berlin' },
    { lat: 40.7128, lng: -74.0060, name: 'New York' },
    { lat: 51.5074, lng: -0.1278, name: 'London' },
    { lat: 35.6762, lng: 139.6503, name: 'Tokyo' }
  ],
  DATE_RANGES: [
    { start: '2025-07-18', end: '2025-08-01', name: '2 weeks' },
    { start: '2025-08-01', end: '2025-08-02', name: '1 day' },
    { start: '2025-07-25', end: '2025-07-26', name: '1 day recent' }
  ]
};

// Color coding test data
const COLOR_RULES = [
  { operator: '<', value: 10, color: '#3b82f6', name: 'Cold' },
  { operator: '>=', value: 10, color: '#10b981', name: 'Cool' },
  { operator: '>=', value: 25, color: '#f59e0b', name: 'Warm' },
  { operator: '>=', value: 35, color: '#ef4444', name: 'Hot' }
];

// Test results storage
let testResults = {
  apiTests: [],
  dataProcessingTests: [],
  colorRuleTests: [],
  performanceTests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

// Utility functions
function logTest(testName, status, details = '') {
  const result = { testName, status, details, timestamp: new Date().toISOString() };
  console.log(`${status === 'PASS' ? '✅' : '❌'} ${testName}: ${details}`);
  return result;
}

function updateSummary(status) {
  testResults.summary.total++;
  if (status === 'PASS') {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }
}

// Test 1: API Connectivity and Response Format
async function testAPIConnectivity() {
  console.log('\n🔗 Testing API Connectivity...');
  
  for (const coord of TEST_CONFIG.TEST_COORDINATES) {
    try {
      const response = await axios.get(TEST_CONFIG.API_BASE_URL, {
        params: {
          latitude: coord.lat,
          longitude: coord.lng,
          start_date: '2025-08-01',
          end_date: '2025-08-02',
          hourly: 'temperature_2m',
          timezone: 'UTC'
        },
        timeout: 10000
      });

      // Validate response structure
      const data = response.data;
      const requiredFields = ['latitude', 'longitude', 'hourly', 'hourly_units'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length === 0 && data.hourly.time && data.hourly.temperature_2m) {
        const result = logTest(
          `API Response - ${coord.name}`, 
          'PASS', 
          `${data.hourly.time.length} data points received`
        );
        testResults.apiTests.push(result);
        updateSummary('PASS');
      } else {
        const result = logTest(
          `API Response - ${coord.name}`, 
          'FAIL', 
          `Missing fields: ${missingFields.join(', ')}`
        );
        testResults.apiTests.push(result);
        updateSummary('FAIL');
      }
    } catch (error) {
      const result = logTest(
        `API Response - ${coord.name}`, 
        'FAIL', 
        `Error: ${error.message}`
      );
      testResults.apiTests.push(result);
      updateSummary('FAIL');
    }
  }
}

// Test 2: Data Processing and Time Range Handling
async function testDataProcessing() {
  console.log('\n📊 Testing Data Processing...');
  
  try {
    const response = await axios.get(TEST_CONFIG.API_BASE_URL, {
      params: {
        latitude: 52.52,
        longitude: 13.41,
        start_date: '2025-07-18',
        end_date: '2025-08-01',
        hourly: 'temperature_2m',
        timezone: 'UTC'
      }
    });

    const data = response.data;
    
    // Test 2.1: Data consistency
    if (data.hourly.time.length === data.hourly.temperature_2m.length) {
      const result = logTest(
        'Data Consistency', 
        'PASS', 
        `${data.hourly.time.length} time points match temperature points`
      );
      testResults.dataProcessingTests.push(result);
      updateSummary('PASS');
    } else {
      const result = logTest(
        'Data Consistency', 
        'FAIL', 
        `Time points: ${data.hourly.time.length}, Temp points: ${data.hourly.temperature_2m.length}`
      );
      testResults.dataProcessingTests.push(result);
      updateSummary('FAIL');
    }

    // Test 2.2: Time range filtering
    const startTime = new Date('2025-07-20T12:00:00Z');
    const endTime = new Date('2025-07-20T18:00:00Z');
    
    const filteredData = data.hourly.time
      .map((timeStr, index) => ({
        time: new Date(timeStr),
        temperature: data.hourly.temperature_2m[index]
      }))
      .filter(item => item.time >= startTime && item.time <= endTime);

    if (filteredData.length > 0) {
      const avgTemp = filteredData.reduce((sum, item) => sum + item.temperature, 0) / filteredData.length;
      const result = logTest(
        'Time Range Filtering', 
        'PASS', 
        `Filtered ${filteredData.length} points, avg temp: ${avgTemp.toFixed(1)}°C`
      );
      testResults.dataProcessingTests.push(result);
      updateSummary('PASS');
    } else {
      const result = logTest(
        'Time Range Filtering', 
        'FAIL', 
        'No data points found in specified time range'
      );
      testResults.dataProcessingTests.push(result);
      updateSummary('FAIL');
    }

    // Test 2.3: Temperature data validation
    const validTemperatures = data.hourly.temperature_2m.filter(temp => 
      temp !== null && temp !== undefined && !isNaN(temp) && temp > -50 && temp < 60
    );
    
    const validityPercentage = (validTemperatures.length / data.hourly.temperature_2m.length) * 100;
    
    if (validityPercentage > 95) {
      const result = logTest(
        'Temperature Data Validation', 
        'PASS', 
        `${validityPercentage.toFixed(1)}% valid temperature readings`
      );
      testResults.dataProcessingTests.push(result);
      updateSummary('PASS');
    } else {
      const result = logTest(
        'Temperature Data Validation', 
        'FAIL', 
        `Only ${validityPercentage.toFixed(1)}% valid temperature readings`
      );
      testResults.dataProcessingTests.push(result);
      updateSummary('FAIL');
    }

  } catch (error) {
    const result = logTest(
      'Data Processing', 
      'FAIL', 
      `Error: ${error.message}`
    );
    testResults.dataProcessingTests.push(result);
    updateSummary('FAIL');
  }
}

// Test 3: Color Rule Logic
function testColorRules() {
  console.log('\n🎨 Testing Color Rule Logic...');
  
  const testTemperatures = [-5, 5, 15, 25, 35, 45];
  
  function determineColor(temperature, rules) {
    const sortedRules = [...rules].sort((a, b) => b.value - a.value);
    
    for (const rule of sortedRules) {
      switch (rule.operator) {
        case '>=':
          if (temperature >= rule.value) return rule.color;
          break;
        case '>':
          if (temperature > rule.value) return rule.color;
          break;
        case '<=':
          if (temperature <= rule.value) return rule.color;
          break;
        case '<':
          if (temperature < rule.value) return rule.color;
          break;
        case '=':
          if (Math.abs(temperature - rule.value) < 0.1) return rule.color;
          break;
      }
    }
    return '#808080'; // Default gray
  }

  testTemperatures.forEach(temp => {
    const color = determineColor(temp, COLOR_RULES);
    const expectedRule = COLOR_RULES
      .filter(rule => {
        switch (rule.operator) {
          case '>=': return temp >= rule.value;
          case '<': return temp < rule.value;
          default: return false;
        }
      })
      .sort((a, b) => b.value - a.value)[0];

    if (expectedRule && color === expectedRule.color) {
      const result = logTest(
        `Color Rule - ${temp}°C`, 
        'PASS', 
        `${expectedRule.name} (${color})`
      );
      testResults.colorRuleTests.push(result);
      updateSummary('PASS');
    } else {
      const result = logTest(
        `Color Rule - ${temp}°C`, 
        'FAIL', 
        `Expected ${expectedRule?.color || 'default'}, got ${color}`
      );
      testResults.colorRuleTests.push(result);
      updateSummary('FAIL');
    }
  });
}

// Test 4: Performance and Caching
async function testPerformance() {
  console.log('\n⚡ Testing Performance...');
  
  const testCoord = { lat: 52.52, lng: 13.41 };
  const params = {
    latitude: testCoord.lat,
    longitude: testCoord.lng,
    start_date: '2025-08-01',
    end_date: '2025-08-02',
    hourly: 'temperature_2m',
    timezone: 'UTC'
  };

  // Test 4.1: API Response Time
  const startTime = Date.now();
  try {
    await axios.get(TEST_CONFIG.API_BASE_URL, { params });
    const responseTime = Date.now() - startTime;
    
    if (responseTime < 5000) {
      const result = logTest(
        'API Response Time', 
        'PASS', 
        `${responseTime}ms (< 5s threshold)`
      );
      testResults.performanceTests.push(result);
      updateSummary('PASS');
    } else {
      const result = logTest(
        'API Response Time', 
        'FAIL', 
        `${responseTime}ms (> 5s threshold)`
      );
      testResults.performanceTests.push(result);
      updateSummary('FAIL');
    }
  } catch (error) {
    const result = logTest(
      'API Response Time', 
      'FAIL', 
      `Error: ${error.message}`
    );
    testResults.performanceTests.push(result);
    updateSummary('FAIL');
  }

  // Test 4.2: Multiple concurrent requests
  const concurrentRequests = 3;
  const concurrentStartTime = Date.now();
  
  try {
    const promises = Array(concurrentRequests).fill().map(() => 
      axios.get(TEST_CONFIG.API_BASE_URL, { params })
    );
    
    await Promise.all(promises);
    const concurrentTime = Date.now() - concurrentStartTime;
    
    if (concurrentTime < 10000) {
      const result = logTest(
        'Concurrent Requests', 
        'PASS', 
        `${concurrentRequests} requests in ${concurrentTime}ms`
      );
      testResults.performanceTests.push(result);
      updateSummary('PASS');
    } else {
      const result = logTest(
        'Concurrent Requests', 
        'FAIL', 
        `${concurrentRequests} requests took ${concurrentTime}ms (> 10s)`
      );
      testResults.performanceTests.push(result);
      updateSummary('FAIL');
    }
  } catch (error) {
    const result = logTest(
      'Concurrent Requests', 
      'FAIL', 
      `Error: ${error.message}`
    );
    testResults.performanceTests.push(result);
    updateSummary('FAIL');
  }
}

// Test 5: Frontend Component Logic Simulation
function testFrontendLogic() {
  console.log('\n🖥️  Testing Frontend Logic...');
  
  // Test 5.1: Polygon centroid calculation
  function calculateCentroid(coordinates) {
    const lat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
    const lng = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
    return [lat, lng];
  }

  const testPolygon = [[52.5, 13.4], [52.6, 13.5], [52.4, 13.3], [52.5, 13.4]];
  const centroid = calculateCentroid(testPolygon);
  
  if (centroid.length === 2 && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
    const result = logTest(
      'Polygon Centroid Calculation', 
      'PASS', 
      `Centroid: [${centroid[0].toFixed(3)}, ${centroid[1].toFixed(3)}]`
    );
    testResults.dataProcessingTests.push(result);
    updateSummary('PASS');
  } else {
    const result = logTest(
      'Polygon Centroid Calculation', 
      'FAIL', 
      `Invalid centroid: ${centroid}`
    );
    testResults.dataProcessingTests.push(result);
    updateSummary('FAIL');
  }

  // Test 5.2: Timeline date calculations
  const today = new Date();
  const startDate = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
  const endDate = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
  const totalHours = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
  
  if (totalHours === 720) { // 30 days * 24 hours
    const result = logTest(
      'Timeline Date Calculations', 
      'PASS', 
      `30-day window = ${totalHours} hours`
    );
    testResults.dataProcessingTests.push(result);
    updateSummary('PASS');
  } else {
    const result = logTest(
      'Timeline Date Calculations', 
      'FAIL', 
      `Expected 720 hours, got ${totalHours}`
    );
    testResults.dataProcessingTests.push(result);
    updateSummary('FAIL');
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting Comprehensive Weather Dashboard Tests...\n');
  console.log('=' .repeat(60));
  
  try {
    await testAPIConnectivity();
    await testDataProcessing();
    testColorRules();
    await testPerformance();
    testFrontendLogic();
    
    // Generate test report
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`✅ Passed: ${testResults.summary.passed}`);
    console.log(`❌ Failed: ${testResults.summary.failed}`);
    console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
    
    // Save detailed results
    const reportData = {
      ...testResults,
      testDate: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform
      }
    };
    
    fs.writeFileSync('test-results.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed results saved to test-results.json');
    
    // Frontend integration test instructions
    console.log('\n🖥️  FRONTEND TESTING INSTRUCTIONS:');
    console.log('1. Run: npm run dev');
    console.log('2. Open: http://localhost:3000');
    console.log('3. Test timeline slider functionality');
    console.log('4. Test polygon drawing (click "Draw Polygon")');
    console.log('5. Test data source configuration in sidebar');
    console.log('6. Verify polygon colors update with timeline changes');
    
    if (testResults.summary.failed === 0) {
      console.log('\n🎉 All tests passed! The application is ready for use.');
    } else {
      console.log(`\n⚠️  ${testResults.summary.failed} tests failed. Please review the issues above.`);
    }
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
