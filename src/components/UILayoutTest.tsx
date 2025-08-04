'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, List, Tag, Alert, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface LayoutTest {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  element?: string;
}

export const UILayoutTest: React.FC = () => {
  const [tests, setTests] = useState<LayoutTest[]>([]);
  const [screenInfo, setScreenInfo] = useState({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false
  });

  useEffect(() => {
    runLayoutTests();
    
    // Auto-retry for map loading
    const retryInterval = setInterval(() => {
      const mapContainer = document.querySelector('.leaflet-container');
      const mapFullyLoaded = document.querySelector('.leaflet-container.map-fully-loaded') || 
                            document.querySelector('[data-map-loaded="true"]');
      
      if (mapContainer && !mapFullyLoaded) {
        runLayoutTests(); // Retry if map exists but not fully loaded
      } else if (mapContainer && mapFullyLoaded) {
        clearInterval(retryInterval); // Stop retrying once map is loaded
      }
    }, 1000);
    
    // Clean up after 10 seconds
    setTimeout(() => clearInterval(retryInterval), 10000);
    
    const handleResize = () => {
      setTimeout(runLayoutTests, 100); // Debounce resize
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(retryInterval);
    };
  }, []);

  const runLayoutTests = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    
    setScreenInfo({ width, height, isMobile, isTablet });

    const layoutTests: LayoutTest[] = [];

    // Test 1: Screen dimensions
    layoutTests.push({
      name: 'Screen Dimensions',
      status: 'pass',
      message: `${width}x${height}px (${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'})`,
      element: 'window'
    });

    // Test 2: Header visibility
    const header = document.querySelector('.ant-layout-header');
    if (header) {
      const headerRect = header.getBoundingClientRect();
      layoutTests.push({
        name: 'Header Layout',
        status: headerRect.width > 0 && headerRect.height > 0 ? 'pass' : 'fail',
        message: `${headerRect.width}x${headerRect.height}px, top: ${headerRect.top}px`,
        element: 'header'
      });
    }

    // Test 3: Content area
    const content = document.querySelector('.ant-layout-content');
    if (content) {
      const contentRect = content.getBoundingClientRect();
      const hasRightMargin = window.getComputedStyle(content).marginRight;
      layoutTests.push({
        name: 'Content Area',
        status: contentRect.width > 200 ? 'pass' : 'fail',
        message: `${contentRect.width}x${contentRect.height}px, margin-right: ${hasRightMargin}`,
        element: 'content'
      });
    }

    // Test 4: Map container
    const mapContainer = document.querySelector('.leaflet-container');
    const mapFullyLoaded = document.querySelector('.leaflet-container.map-fully-loaded') || 
                          document.querySelector('[data-map-loaded="true"]');
    
    if (mapContainer && mapFullyLoaded) {
      const mapRect = mapContainer.getBoundingClientRect();
      layoutTests.push({
        name: 'Map Container',
        status: mapRect.width > 300 && mapRect.height > 400 ? 'pass' : 'warning',
        message: `${mapRect.width}x${mapRect.height}px - Fully loaded`,
        element: 'map'
      });
    } else if (mapContainer) {
      const mapRect = mapContainer.getBoundingClientRect();
      layoutTests.push({
        name: 'Map Container',
        status: 'warning',
        message: `${mapRect.width}x${mapRect.height}px - Still loading...`,
        element: 'map'
      });
    } else {
      layoutTests.push({
        name: 'Map Container',
        status: 'warning',
        message: 'Map container not found - initializing...',
        element: 'map'
      });
    }

    // Test 5: Sidebar/Drawer
    const sidebar = document.querySelector('[style*="position: fixed"][style*="right: 0"]');
    const drawer = document.querySelector('.ant-drawer');
    
    if (isMobile) {
      layoutTests.push({
        name: 'Mobile Controls',
        status: drawer || !sidebar ? 'pass' : 'warning',
        message: drawer ? 'Drawer available' : 'Should use drawer on mobile',
        element: 'sidebar'
      });
    } else {
      if (sidebar) {
        const sidebarRect = sidebar.getBoundingClientRect();
        layoutTests.push({
          name: 'Desktop Sidebar',
          status: sidebarRect.width > 250 && sidebarRect.right <= width ? 'pass' : 'fail',
          message: `${sidebarRect.width}x${sidebarRect.height}px, right: ${sidebarRect.right}px`,
          element: 'sidebar'
        });
      }
    }

    // Test 6: Timeline slider
    const timeline = document.querySelector('[class*="timeline"]') || 
                    document.querySelector('.react-range-track') ||
                    document.querySelector('[role="slider"]');
    if (timeline) {
      const timelineRect = timeline.getBoundingClientRect();
      layoutTests.push({
        name: 'Timeline Slider',
        status: timelineRect.width > 200 ? 'pass' : 'warning',
        message: `${timelineRect.width}px wide`,
        element: 'timeline'
      });
    }

    // Test 7: Overflow check
    const body = document.body;
    const hasHorizontalScroll = body.scrollWidth > body.clientWidth;
    layoutTests.push({
      name: 'Horizontal Overflow',
      status: hasHorizontalScroll ? 'warning' : 'pass',
      message: hasHorizontalScroll ? 
        `Page width: ${body.scrollWidth}px, viewport: ${body.clientWidth}px` : 
        'No horizontal overflow',
      element: 'body'
    });

    // Test 8: Z-index conflicts
    const elementsWithHighZIndex = Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const zIndex = window.getComputedStyle(el).zIndex;
        return zIndex !== 'auto' && parseInt(zIndex) > 50;
      });
    
    layoutTests.push({
      name: 'Z-Index Layers',
      status: elementsWithHighZIndex.length < 10 ? 'pass' : 'warning',
      message: `${elementsWithHighZIndex.length} elements with high z-index`,
      element: 'layers'
    });

    setTests(layoutTests);
  };

  const getStatusIcon = (status: LayoutTest['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'fail':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <InfoCircleOutlined style={{ color: '#faad14' }} />;
    }
  };

  const getStatusTag = (status: LayoutTest['status']) => {
    const colors = {
      pass: 'success',
      fail: 'error',
      warning: 'warning'
    };
    
    return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
  };

  const passedTests = tests.filter(t => t.status === 'pass').length;
  const failedTests = tests.filter(t => t.status === 'fail').length;
  const warningTests = tests.filter(t => t.status === 'warning').length;

  return (
    <Card 
      title="UI Layout Tests" 
      className="m-4"
      extra={
        <Button onClick={runLayoutTests} type="primary">
          Refresh Tests
        </Button>
      }
    >
      <Space direction="vertical" className="w-full">
        {/* Screen Info */}
        <Alert
          message={`Screen: ${screenInfo.width}x${screenInfo.height}px`}
          description={`Device type: ${screenInfo.isMobile ? 'Mobile' : screenInfo.isTablet ? 'Tablet' : 'Desktop'}`}
          type="info"
          showIcon
        />

        {/* Test Results Summary */}
        <div className="mb-4">
          <Text strong>
            Results: {passedTests} passed, {warningTests} warnings, {failedTests} failed
          </Text>
        </div>

        {/* Test List */}
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
                      {test.element && (
                        <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                          {test.element}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {getStatusTag(test.status)}
              </div>
            </List.Item>
          )}
        />

        {/* Layout Recommendations */}
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <Title level={5}>Layout Recommendations</Title>
          <ul className="text-sm">
            <li>✅ Map should be at least 300px wide and 400px tall</li>
            <li>✅ Sidebar should be 320px wide on desktop</li>
            <li>✅ Content should have right margin on desktop (320px)</li>
            <li>✅ No horizontal scrolling should occur</li>
            <li>✅ Mobile should use drawer instead of fixed sidebar</li>
            <li>✅ Timeline should be responsive and at least 200px wide</li>
          </ul>
        </div>

        {/* Quick Fixes */}
        {(failedTests > 0 || warningTests > 0) && (
          <Alert
            message="Layout Issues Detected"
            description={
              <div>
                <p>Try these fixes:</p>
                <ul>
                  <li>Refresh the page to reload components</li>
                  <li>Resize the browser window to trigger responsive layout</li>
                  <li>Check browser console for CSS errors</li>
                  <li>Ensure all components have loaded properly</li>
                </ul>
              </div>
            }
            type="warning"
            showIcon
          />
        )}
      </Space>
    </Card>
  );
};
