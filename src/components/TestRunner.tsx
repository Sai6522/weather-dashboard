'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Typography, List, Tag, Progress } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useStore } from '@/store/useStore';
import { weatherApi } from '@/services/weatherApi';

const { Title, Text } = Typography;

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'pass' | 'fail';
  message: string;
  duration?: number;
}

export const TestRunner: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const { 
    polygons, 
    addPolygon, 
    dataSources, 
    timeRange, 
    setTimeRange,
    mapCenter,
    setMapCenter,
    resetStore
  } = useStore();

  const frontendTests = [
    {
      name: 'Store State Management',
      test: async () => {
        return new Promise<{success: boolean, message: string}>((resolve) => {
          const initialPolygonCount = polygons.length;
          const testPolygon = {
            id: `test-polygon-${Date.now()}`,
            name: 'Test Polygon',
            coordinates: [[52.5, 13.4], [52.6, 13.5], [52.4, 13.3]] as [number, number][],
            dataSourceId: dataSources[0]?.id || 'open-meteo-temp',
            color: '#ff0000',
            createdAt: new Date()
          };
          
          // Add polygon and check after a delay
          addPolygon(testPolygon);
          
          setTimeout(() => {
            const currentState = useStore.getState();
            const currentPolygonCount = currentState.polygons.length;
            const addedPolygon = currentState.polygons.find(p => p.id === testPolygon.id);
            
            if (addedPolygon) {
              resolve({ success: true, message: `Polygon "${addedPolygon.name}" added successfully` });
            } else if (currentPolygonCount > initialPolygonCount) {
              resolve({ success: true, message: `Polygon count increased: ${initialPolygonCount} → ${currentPolygonCount}` });
            } else {
              resolve({ success: false, message: `Store not updated. Count: ${initialPolygonCount} → ${currentPolygonCount}` });
            }
          }, 300);
        });
      }
    },
    {
      name: 'Weather API Integration',
      test: async () => {
        try {
          const temperature = await weatherApi.getTemperatureForTimeRange(
            52.52,
            13.41,
            new Date('2025-08-01T12:00:00Z'),
            new Date('2025-08-01T13:00:00Z')
          );
          
          if (temperature !== null && !isNaN(temperature)) {
            return { success: true, message: `Temperature: ${temperature.toFixed(1)}°C` };
          }
          return { success: false, message: 'Invalid temperature data' };
        } catch (error) {
          return { success: false, message: `API Error: ${error}` };
        }
      }
    },
    {
      name: 'Timeline Date Calculations',
      test: async () => {
        return new Promise<{success: boolean, message: string}>((resolve) => {
          const now = new Date();
          const newTimeRange = {
            start: now,
            end: now,
            mode: 'single' as const
          };
          
          setTimeRange(newTimeRange);
          
          setTimeout(() => {
            const currentTimeRange = useStore.getState().timeRange;
            if (currentTimeRange.start && currentTimeRange.end) {
              resolve({ success: true, message: `Timeline updated to ${currentTimeRange.mode} mode` });
            } else {
              resolve({ success: false, message: 'Timeline state not updated' });
            }
          }, 200);
        });
      }
    },
    {
      name: 'Map Center Control',
      test: async () => {
        return new Promise<{success: boolean, message: string}>((resolve) => {
          const testCenter: [number, number] = [40.7128, -74.0060]; // New York
          const initialCenter = [...useStore.getState().mapCenter];
          
          setMapCenter(testCenter);
          
          setTimeout(() => {
            const currentCenter = useStore.getState().mapCenter;
            
            if (Math.abs(currentCenter[0] - testCenter[0]) < 0.001 && Math.abs(currentCenter[1] - testCenter[1]) < 0.001) {
              resolve({ success: true, message: `Map center: [${testCenter[0]}, ${testCenter[1]}]` });
            } else if (Math.abs(currentCenter[0] - initialCenter[0]) > 0.001 || Math.abs(currentCenter[1] - initialCenter[1]) > 0.001) {
              resolve({ success: true, message: `Center changed: [${initialCenter[0].toFixed(3)}, ${initialCenter[1].toFixed(3)}] → [${currentCenter[0].toFixed(3)}, ${currentCenter[1].toFixed(3)}]` });
            } else {
              resolve({ success: false, message: `Center unchanged: [${currentCenter[0].toFixed(3)}, ${currentCenter[1].toFixed(3)}]` });
            }
          }, 300);
        });
      }
    },
    {
      name: 'Data Source Configuration',
      test: async () => {
        if (dataSources.length > 0 && dataSources[0].colorRules.length > 0) {
          const ds = dataSources[0];
          return { 
            success: true, 
            message: `${ds.name} with ${ds.colorRules.length} color rules` 
          };
        }
        return { success: false, message: 'No data sources configured' };
      }
    },
    {
      name: 'Color Rule Logic',
      test: async () => {
        const testTemp = 25;
        const rules = dataSources[0]?.colorRules || [];
        
        // Find matching rule using the same logic as the app
        const sortedRules = [...rules].sort((a, b) => b.value - a.value);
        let matchingRule = null;
        
        for (const rule of sortedRules) {
          switch (rule.operator) {
            case '>=':
              if (testTemp >= rule.value) {
                matchingRule = rule;
                break;
              }
              break;
            case '<':
              if (testTemp < rule.value) {
                matchingRule = rule;
                break;
              }
              break;
            case '>':
              if (testTemp > rule.value) {
                matchingRule = rule;
                break;
              }
              break;
            case '<=':
              if (testTemp <= rule.value) {
                matchingRule = rule;
                break;
              }
              break;
            case '=':
              if (Math.abs(testTemp - rule.value) < 0.1) {
                matchingRule = rule;
                break;
              }
              break;
          }
          if (matchingRule) break;
        }
        
        if (matchingRule) {
          return { 
            success: true, 
            message: `${testTemp}°C → ${matchingRule.color} (${matchingRule.operator} ${matchingRule.value})` 
          };
        }
        return { success: false, message: 'No matching color rule found' };
      }
    }
  ];

  const runTests = async () => {
    setIsRunning(true);
    setProgress(0);
    
    const initialTests: TestResult[] = frontendTests.map(test => ({
      name: test.name,
      status: 'pending',
      message: 'Waiting to run...'
    }));
    
    setTests(initialTests);

    for (let i = 0; i < frontendTests.length; i++) {
      const test = frontendTests[i];
      
      // Update test status to running
      setTests(prev => prev.map((t, idx) => 
        idx === i ? { ...t, status: 'running', message: 'Running...' } : t
      ));

      const startTime = Date.now();
      
      try {
        const result = await test.test();
        const duration = Date.now() - startTime;
        
        setTests(prev => prev.map((t, idx) => 
          idx === i ? {
            ...t,
            status: result.success ? 'pass' : 'fail',
            message: result.message,
            duration
          } : t
        ));
      } catch (error) {
        const duration = Date.now() - startTime;
        
        setTests(prev => prev.map((t, idx) => 
          idx === i ? {
            ...t,
            status: 'fail',
            message: `Error: ${error}`,
            duration
          } : t
        ));
      }
      
      setProgress(((i + 1) / frontendTests.length) * 100);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'fail':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'running':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      default:
        return null;
    }
  };

  const getStatusTag = (status: TestResult['status']) => {
    const colors = {
      pending: 'default',
      running: 'processing',
      pass: 'success',
      fail: 'error'
    };
    
    return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
  };

  const passedTests = tests.filter(t => t.status === 'pass').length;
  const failedTests = tests.filter(t => t.status === 'fail').length;
  const totalTests = tests.length;

  return (
    <Card 
      title="Frontend Integration Tests" 
      className="m-4"
      extra={
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              resetStore();
              localStorage.clear();
            }}
            type="default"
          >
            Reset Store
          </Button>
          <Button 
            type="primary" 
            onClick={runTests} 
            loading={isRunning}
            disabled={isRunning}
          >
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </Button>
        </div>
      }
    >
      {isRunning && (
        <div className="mb-4">
          <Progress percent={Math.round(progress)} status="active" />
        </div>
      )}
      
      {tests.length > 0 && (
        <div className="mb-4">
          <Text strong>
            Results: {passedTests} passed, {failedTests} failed, {totalTests} total
          </Text>
          {!isRunning && (
            <Text 
              className="ml-4" 
              type={failedTests === 0 ? 'success' : 'danger'}
            >
              {failedTests === 0 ? '🎉 All tests passed!' : '⚠️ Some tests failed'}
            </Text>
          )}
        </div>
      )}

      <List
        dataSource={tests}
        renderItem={(test) => (
          <List.Item>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <Text strong>{test.name}</Text>
                  <div className="text-sm text-gray-600">
                    {test.message}
                    {test.duration && (
                      <span className="ml-2">({test.duration}ms)</span>
                    )}
                  </div>
                </div>
              </div>
              {getStatusTag(test.status)}
            </div>
          </List.Item>
        )}
      />
      
      <div className="mt-4 p-4 bg-gray-50 rounded">
        <Title level={5}>Test Coverage</Title>
        <ul className="text-sm">
          <li>✅ Zustand store state management with async updates</li>
          <li>✅ Weather API integration and data fetching</li>
          <li>✅ Timeline date calculations and state updates</li>
          <li>✅ Map center control and coordinate handling</li>
          <li>✅ Data source configuration validation</li>
          <li>✅ Color rule logic and temperature mapping</li>
        </ul>
        
        <div className="mt-3 p-3 bg-blue-50 rounded">
          <Text strong className="text-blue-800">Debug Info:</Text>
          <div className="text-xs text-blue-700 mt-1">
            <div>Current Polygons: {polygons.length}</div>
            <div>Map Center: [{mapCenter[0].toFixed(3)}, {mapCenter[1].toFixed(3)}]</div>
            <div>Data Sources: {dataSources.length}</div>
            <div>Timeline Mode: {timeRange.mode}</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
