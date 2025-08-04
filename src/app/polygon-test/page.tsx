'use client';

import React, { useState } from 'react';
import { Button, Card, Typography, Space, message } from 'antd';
import { weatherApi } from '@/services/weatherApi';

const { Title, Text } = Typography;

export default function PolygonTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  const testPolygonCreation = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      // Simulate polygon creation with Berlin coordinates
      const polygonCoordinates: [number, number][] = [
        [52.5200, 13.4050], // Berlin center
        [52.5300, 13.4150], // Northeast
        [52.5100, 13.4150], // Southeast
        [52.5100, 13.3950], // Southwest
        [52.5300, 13.3950], // Northwest
      ];

      // Calculate centroid
      const centroid: [number, number] = [
        polygonCoordinates.reduce((sum, coord) => sum + coord[0], 0) / polygonCoordinates.length,
        polygonCoordinates.reduce((sum, coord) => sum + coord[1], 0) / polygonCoordinates.length
      ];

      console.log('🔺 Testing polygon creation');
      console.log('📍 Polygon coordinates:', polygonCoordinates);
      console.log('🎯 Centroid:', centroid);

      // Test with yesterday's date (since API only has historical data)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      console.log('📅 Using date:', yesterday.toISOString());

      // Fetch temperature data
      const temperature = await weatherApi.getTemperatureForTimeRange(
        centroid[0],
        centroid[1],
        yesterday,
        yesterday
      );

      console.log('🌡️ Temperature result:', temperature);

      // Determine color based on temperature
      const colorRules = [
        { operator: '<', value: 10, color: '#3b82f6' }, // Blue
        { operator: '>=', value: 10, color: '#10b981' }, // Green
        { operator: '>=', value: 25, color: '#f59e0b' }, // Yellow
        { operator: '>=', value: 35, color: '#ef4444' }, // Red
      ];

      let polygonColor = '#808080'; // Default gray
      if (temperature !== null) {
        for (const rule of colorRules.reverse()) { // Check from highest to lowest
          if (rule.operator === '>=' && temperature >= rule.value) {
            polygonColor = rule.color;
            break;
          } else if (rule.operator === '<' && temperature < rule.value) {
            polygonColor = rule.color;
            break;
          }
        }
      }

      const result = {
        success: true,
        polygonId: `test-polygon-${Date.now()}`,
        coordinates: polygonCoordinates,
        centroid,
        temperature,
        color: polygonColor,
        timestamp: new Date().toISOString()
      };

      setTestResults([result]);
      
      if (temperature !== null) {
        message.success(`✅ Polygon created successfully! Temperature: ${temperature.toFixed(1)}°C`);
      } else {
        message.warning('⚠️ Polygon created but no temperature data available');
      }

    } catch (error) {
      console.error('❌ Polygon test failed:', error);
      message.error('❌ Polygon test failed: ' + (error as Error).message);
      
      setTestResults([{
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const testMultipleLocations = async () => {
    setIsLoading(true);
    setTestResults([]);

    const testLocations = [
      { name: 'Berlin', coords: [52.5200, 13.4050] as [number, number] },
      { name: 'London', coords: [51.5074, -0.1278] as [number, number] },
      { name: 'Paris', coords: [48.8566, 2.3522] as [number, number] },
      { name: 'Madrid', coords: [40.4168, -3.7038] as [number, number] },
    ];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const results = [];

    for (const location of testLocations) {
      try {
        console.log(`🌍 Testing ${location.name}...`);
        
        const temperature = await weatherApi.getTemperatureForTimeRange(
          location.coords[0],
          location.coords[1],
          yesterday,
          yesterday
        );

        results.push({
          success: true,
          name: location.name,
          coordinates: location.coords,
          temperature,
          timestamp: new Date().toISOString()
        });

        console.log(`✅ ${location.name}: ${temperature ? temperature.toFixed(1) + '°C' : 'N/A'}`);

      } catch (error) {
        console.error(`❌ ${location.name} failed:`, error);
        results.push({
          success: false,
          name: location.name,
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        });
      }
    }

    setTestResults(results);
    setIsLoading(false);

    const successCount = results.filter(r => r.success).length;
    message.info(`✅ ${successCount}/${testLocations.length} locations tested successfully`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Title level={2} className="text-blue-600 mb-6">
          🧪 Polygon Temperature Test
        </Title>
        
        <Card className="mb-6">
          <Space direction="vertical" size="large" className="w-full">
            <div>
              <Text className="text-gray-600">
                This page tests the polygon temperature fetching functionality to debug the "N/A" issue.
              </Text>
            </div>
            
            <Space>
              <Button 
                type="primary" 
                onClick={testPolygonCreation}
                loading={isLoading}
                size="large"
              >
                🔺 Test Single Polygon
              </Button>
              
              <Button 
                onClick={testMultipleLocations}
                loading={isLoading}
                size="large"
              >
                🌍 Test Multiple Locations
              </Button>
            </Space>
          </Space>
        </Card>

        {testResults.length > 0 && (
          <Card title="📊 Test Results">
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  {result.success ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: result.color || '#10b981' }}
                        />
                        <Text strong>
                          {result.name || `Polygon ${index + 1}`}
                        </Text>
                        <Text className="text-green-600">✅ SUCCESS</Text>
                      </div>
                      
                      {result.temperature !== undefined && (
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>🌡️ Temperature: <strong>{result.temperature ? result.temperature.toFixed(1) + '°C' : 'N/A'}</strong></div>
                          {result.centroid && (
                            <div>📍 Centroid: {result.centroid[0].toFixed(4)}, {result.centroid[1].toFixed(4)}</div>
                          )}
                          {result.coordinates && (
                            <div>🔺 Coordinates: {result.coordinates.length} points</div>
                          )}
                          <div>⏰ Time: {new Date(result.timestamp).toLocaleString()}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Text strong className="text-red-600">
                          {result.name || `Test ${index + 1}`} ❌ FAILED
                        </Text>
                      </div>
                      <div className="text-sm text-red-600">
                        Error: {result.error}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card title="🔍 Debug Information" className="mt-6">
          <div className="text-sm text-gray-600 space-y-2">
            <div>• Open browser console to see detailed API logs</div>
            <div>• API uses historical data only (up to yesterday)</div>
            <div>• Temperature data is fetched from Open-Meteo archive API</div>
            <div>• Polygon colors are determined by temperature thresholds</div>
            <div>• Check Network tab to see actual API requests</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
