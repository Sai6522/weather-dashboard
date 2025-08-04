'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Drawer, Space, Card, Badge, Tooltip, FloatButton, notification } from 'antd';
import { MenuOutlined, ReloadOutlined, FullscreenOutlined, FullscreenExitOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { TimelineSlider } from './TimelineSlider';
import { InteractiveMap } from './InteractiveMap';
import { DataSourceSidebar } from './DataSourceSidebar';
import { PerformanceMonitor } from './PerformanceMonitor';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/contexts/ThemeContext';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export const Dashboard: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { resetStore, polygons: allPolygons, getVisiblePolygons, dataSources } = useStore();
  const { effectiveTheme } = useTheme();
  
  const visiblePolygons = getVisiblePolygons();

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fullscreen functionality
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleReset = () => {
    notification.warning({
      message: 'Reset Dashboard',
      description: 'All polygons and settings will be cleared. This action cannot be undone.',
      placement: 'topRight',
      duration: 3,
      style: {
        backgroundColor: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
        border: `2px solid ${effectiveTheme === 'dark' ? '#4b5563' : '#d1d5db'}`,
        color: effectiveTheme === 'dark' ? '#ffffff' : '#000000',
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)'
      },
      onClose: () => {
        resetStore();
        window.location.reload();
      }
    });
  };

  const showWelcomeHelp = () => {
    notification.info({
      message: '🌤️ Welcome to Weather Dashboard!',
      description: (
        <div style={{ color: effectiveTheme === 'dark' ? '#e5e7eb' : '#4b5563' }}>
          <p style={{ margin: '4px 0', fontWeight: 500 }}>• Draw polygons on the map to analyze weather patterns</p>
          <p style={{ margin: '4px 0', fontWeight: 500 }}>• Use the timeline to explore historical data</p>
          <p style={{ margin: '4px 0', fontWeight: 500 }}>• Configure data sources in the right panel</p>
        </div>
      ),
      placement: 'topRight',
      duration: 8,
      style: {
        backgroundColor: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
        border: `2px solid ${effectiveTheme === 'dark' ? '#4b5563' : '#d1d5db'}`,
        color: effectiveTheme === 'dark' ? '#ffffff' : '#000000',
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)'
      }
    });
  };

  return (
    <Layout 
      className="min-h-screen"
      style={{ backgroundColor: effectiveTheme === 'dark' ? '#111827' : '#f5f5f5' }}
    >
      <Header 
        className="shadow-sm border-b px-4 md:px-6"
        style={{ 
          backgroundColor: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
          borderBottomColor: effectiveTheme === 'dark' ? '#4b5563' : '#f0f0f0'
        }}
      >
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-2 md:gap-4">
            <Title 
              level={isMobile ? 4 : 3} 
              className="m-0"
              style={{ 
                color: effectiveTheme === 'dark' ? '#60a5fa' : '#1890ff',
                fontWeight: 600,
                textShadow: effectiveTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.5)' : 'none'
              }}
            >
              🌤️ {isMobile ? 'Weather' : 'Weather Data Dashboard'}
            </Title>
            {!isMobile && (
              <div className="header-badges">
                <div className="header-badge-item">
                  <Badge count={dataSources.length} showZero color="green">
                    <span></span>
                  </Badge>
                  <Text style={{ 
                    color: effectiveTheme === 'dark' ? '#d1d5db' : '#4b5563',
                    fontWeight: 500,
                    fontSize: '14px'
                  }}>
                    Data Sources
                  </Text>
                </div>
                <div className="header-badge-item">
                  <Badge count={visiblePolygons.length} showZero>
                    <span></span>
                  </Badge>
                  <Text style={{ 
                    color: effectiveTheme === 'dark' ? '#d1d5db' : '#4b5563',
                    fontWeight: 500,
                    fontSize: '14px'
                  }}>
                    Polygons
                  </Text>
                </div>
              </div>
            )}
          </div>
          
          <Space size={isMobile ? 'small' : 'middle'}>
            <ThemeSwitcher />
            
            <Tooltip title="Toggle Fullscreen">
              <Button 
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
                type="text"
                size={isMobile ? 'small' : 'middle'}
                style={{
                  color: effectiveTheme === 'dark' ? '#ffffff' : '#000000',
                  backgroundColor: 'transparent',
                  border: `1px solid ${effectiveTheme === 'dark' ? '#4b5563' : '#d9d9d9'}`
                }}
              />
            </Tooltip>
            
            {(isMobile || isTablet) && (
              <Button 
                icon={<MenuOutlined />} 
                onClick={() => setSidebarVisible(true)}
                type="primary"
                size={isMobile ? 'small' : 'middle'}
                style={{
                  backgroundColor: effectiveTheme === 'dark' ? '#3b82f6' : '#1890ff',
                  borderColor: effectiveTheme === 'dark' ? '#3b82f6' : '#1890ff',
                  fontWeight: 500
                }}
              >
                {isMobile ? '' : 'Controls'}
              </Button>
            )}
            
            <Tooltip title="Reset all data">
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleReset}
                type="default"
                size={isMobile ? 'small' : 'middle'}
                danger
                style={{
                  fontWeight: 500,
                  color: effectiveTheme === 'dark' ? '#ffffff' : '#000000',
                  backgroundColor: effectiveTheme === 'dark' ? '#374151' : '#ffffff',
                  borderColor: effectiveTheme === 'dark' ? '#ef4444' : '#ff4d4f'
                }}
              >
                {isMobile ? '' : 'Reset'}
              </Button>
            </Tooltip>
          </Space>
        </div>
      </Header>
      
      <Layout style={{ backgroundColor: effectiveTheme === 'dark' ? '#111827' : '#f5f5f5' }}>
        <Content 
          className={`p-3 md:p-6 main-content ${isMobile ? 'pb-20' : ''}`}
          style={{ 
            marginRight: (isMobile || isTablet) ? 0 : 320,
            minHeight: 'calc(100vh - 64px)',
            maxHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: effectiveTheme === 'dark' ? '#111827' : '#f5f5f5'
          }}
        >
          <div className="max-w-full space-y-4 md:space-y-6">
            {/* Welcome Card - Responsive */}
            <Card 
              className="shadow-md"
              bodyStyle={{ 
                padding: isMobile ? '16px' : '24px',
                background: effectiveTheme === 'dark' 
                  ? 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)' 
                  : 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
                borderRadius: '8px'
              }}
              style={{
                backgroundColor: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
                borderColor: effectiveTheme === 'dark' ? '#3b82f6' : '#93c5fd',
                borderWidth: '2px'
              }}
            >
              <div className="text-center">
                <Title 
                  level={isMobile ? 5 : 4} 
                  className="mb-2"
                  style={{ 
                    color: effectiveTheme === 'dark' ? '#ffffff' : '#1e40af',
                    fontWeight: 700,
                    textShadow: effectiveTheme === 'dark' ? '0 2px 4px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.1)',
                    marginBottom: '8px'
                  }}
                >
                  Interactive Weather Data Visualization
                </Title>
                <Text 
                  className="text-sm md:text-base"
                  style={{ 
                    color: effectiveTheme === 'dark' ? '#e5e7eb' : '#1e40af',
                    fontWeight: 500,
                    fontSize: isMobile ? '14px' : '16px',
                    lineHeight: '1.6',
                    textShadow: effectiveTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                  }}
                >
                  Draw polygons on the map, configure data sources, and visualize weather patterns over time
                </Text>
                {!isMobile && (
                  <div className="mt-4">
                    <Button 
                      type="link" 
                      icon={<QuestionCircleOutlined />}
                      onClick={showWelcomeHelp}
                      style={{ 
                        color: effectiveTheme === 'dark' ? '#60a5fa' : '#2563eb',
                        fontWeight: 600,
                        fontSize: '14px',
                        textShadow: effectiveTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                      }}
                    >
                      Show Quick Help
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Stats Cards - Mobile Responsive */}
            {isMobile && (
              <div className="grid grid-cols-2 gap-3">
                <Card 
                  size="small" 
                  className="text-center shadow-md"
                  style={{
                    backgroundColor: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
                    borderColor: effectiveTheme === 'dark' ? '#3b82f6' : '#93c5fd',
                    borderWidth: '2px'
                  }}
                >
                  <div 
                    className="text-2xl font-bold"
                    style={{ 
                      color: effectiveTheme === 'dark' ? '#60a5fa' : '#2563eb',
                      fontWeight: 700,
                      textShadow: effectiveTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                    }}
                  >
                    {visiblePolygons.length}
                  </div>
                  <div 
                    className="text-xs"
                    style={{ 
                      color: effectiveTheme === 'dark' ? '#d1d5db' : '#4b5563',
                      fontWeight: 600,
                      fontSize: '12px'
                    }}
                  >
                    Active Polygons
                  </div>
                </Card>
                <Card 
                  size="small" 
                  className="text-center shadow-md"
                  style={{
                    backgroundColor: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
                    borderColor: effectiveTheme === 'dark' ? '#10b981' : '#34d399',
                    borderWidth: '2px'
                  }}
                >
                  <div 
                    className="text-2xl font-bold"
                    style={{ 
                      color: effectiveTheme === 'dark' ? '#34d399' : '#059669',
                      fontWeight: 700,
                      textShadow: effectiveTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                    }}
                  >
                    {dataSources.length}
                  </div>
                  <div 
                    className="text-xs"
                    style={{ 
                      color: effectiveTheme === 'dark' ? '#d1d5db' : '#4b5563',
                      fontWeight: 600,
                      fontSize: '12px'
                    }}
                  >
                    Data Sources
                  </div>
                </Card>
              </div>
            )}

            {/* Timeline Slider - Responsive */}
            <Card 
              title="📅 Timeline Control" 
              className="shadow-md"
              bodyStyle={{ padding: isMobile ? '12px' : '24px' }}
            >
              <TimelineSlider />
            </Card>
            
            {/* Map Container - Responsive */}
            <Card 
              title="🗺️ Interactive Map" 
              className="shadow-md"
              bodyStyle={{ padding: isMobile ? '8px' : '16px' }}
            >
              <div 
                className="bg-white rounded-lg overflow-hidden" 
                style={{ 
                  minHeight: isMobile ? '400px' : '600px',
                  height: isMobile ? '50vh' : '600px'
                }}
              >
                <InteractiveMap />
              </div>
            </Card>

            {/* Quick Start Guide - Responsive Grid */}
            <Card 
              title="🚀 Quick Start Guide" 
              className="shadow-md"
              bodyStyle={{ padding: isMobile ? '16px' : '24px' }}
              style={{
                backgroundColor: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
                borderColor: effectiveTheme === 'dark' ? '#4b5563' : '#d9d9d9',
                borderWidth: '2px'
              }}
              headStyle={{
                backgroundColor: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
                borderBottomColor: effectiveTheme === 'dark' ? '#4b5563' : '#f0f0f0',
                color: effectiveTheme === 'dark' ? '#ffffff' : '#000000'
              }}
            >
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'md:grid-cols-3 gap-4'}`}>
                <div 
                  className="text-center p-4 rounded-lg transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: effectiveTheme === 'dark' ? '#1e3a8a' : '#dbeafe',
                    border: `2px solid ${effectiveTheme === 'dark' ? '#3b82f6' : '#93c5fd'}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = effectiveTheme === 'dark' ? '#1e40af' : '#bfdbfe';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = effectiveTheme === 'dark' ? '#1e3a8a' : '#dbeafe';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="text-2xl mb-2">1️⃣</div>
                  <Text 
                    strong 
                    style={{ 
                      color: effectiveTheme === 'dark' ? '#ffffff' : '#1e40af',
                      fontWeight: 700,
                      fontSize: '16px',
                      textShadow: effectiveTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                    }}
                  >
                    Draw Polygon
                  </Text>
                  <div 
                    className="text-sm mt-1"
                    style={{ 
                      color: effectiveTheme === 'dark' ? '#e5e7eb' : '#1e40af',
                      fontWeight: 500,
                      lineHeight: '1.5',
                      textShadow: effectiveTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                    }}
                  >
                    Click "Draw Polygon" and {isMobile ? 'tap' : 'click'} on the map to create regions
                  </div>
                </div>
                <div 
                  className="text-center p-4 rounded-lg transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: effectiveTheme === 'dark' ? '#064e3b' : '#d1fae5',
                    border: `2px solid ${effectiveTheme === 'dark' ? '#10b981' : '#34d399'}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = effectiveTheme === 'dark' ? '#065f46' : '#a7f3d0';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = effectiveTheme === 'dark' ? '#064e3b' : '#d1fae5';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="text-2xl mb-2">2️⃣</div>
                  <Text 
                    strong 
                    style={{ 
                      color: effectiveTheme === 'dark' ? '#ffffff' : '#065f46',
                      fontWeight: 700,
                      fontSize: '16px',
                      textShadow: effectiveTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                    }}
                  >
                    Configure Data
                  </Text>
                  <div 
                    className="text-sm mt-1"
                    style={{ 
                      color: effectiveTheme === 'dark' ? '#e5e7eb' : '#065f46',
                      fontWeight: 500,
                      lineHeight: '1.5',
                      textShadow: effectiveTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                    }}
                  >
                    Use the {isMobile ? 'controls menu' : 'sidebar'} to set up data sources and color rules
                  </div>
                </div>
                <div 
                  className="text-center p-4 rounded-lg transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: effectiveTheme === 'dark' ? '#581c87' : '#e9d5ff',
                    border: `2px solid ${effectiveTheme === 'dark' ? '#a855f7' : '#c084fc'}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = effectiveTheme === 'dark' ? '#6b21a8' : '#ddd6fe';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = effectiveTheme === 'dark' ? '#581c87' : '#e9d5ff';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="text-2xl mb-2">3️⃣</div>
                  <Text 
                    strong 
                    style={{ 
                      color: effectiveTheme === 'dark' ? '#ffffff' : '#581c87',
                      fontWeight: 700,
                      fontSize: '16px',
                      textShadow: effectiveTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                    }}
                  >
                    Explore Timeline
                  </Text>
                  <div 
                    className="text-sm mt-1"
                    style={{ 
                      color: effectiveTheme === 'dark' ? '#e5e7eb' : '#581c87',
                      fontWeight: 500,
                      lineHeight: '1.5',
                      textShadow: effectiveTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                    }}
                  >
                    Use the timeline slider to see weather changes over time
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Content>
        
        {/* Desktop Sidebar */}
        {!isMobile && !isTablet && (
          <div
            className="shadow-lg border-l fixed-sidebar"
            style={{ 
              position: 'fixed',
              right: 0,
              top: 64,
              bottom: 0,
              width: 320,
              zIndex: 100,
              overflowY: 'auto',
              overflowX: 'hidden',
              backgroundColor: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
              borderLeftColor: effectiveTheme === 'dark' ? '#4b5563' : '#e5e7eb',
              borderLeftWidth: '2px'
            }}
          >
            {/* Sidebar Header */}
            <div 
              className="sticky top-0 border-b px-4 py-3 z-10"
              style={{ 
                backgroundColor: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
                borderBottomColor: effectiveTheme === 'dark' ? '#4b5563' : '#e5e7eb',
                borderBottomWidth: '2px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <div className="flex items-center justify-between">
                <Title 
                  level={5} 
                  className="m-0"
                  style={{ 
                    color: effectiveTheme === 'dark' ? '#ffffff' : '#000000',
                    fontWeight: 700,
                    fontSize: '16px',
                    textShadow: effectiveTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                  }}
                >
                  🎛️ Controls Panel
                </Title>
                <div className="flex items-center gap-2">
                  <div 
                    className="text-xs"
                    style={{ 
                      color: effectiveTheme === 'dark' ? '#d1d5db' : '#6b7280',
                      fontWeight: 600
                    }}
                  >
                    Fixed
                  </div>
                  <div 
                    className="w-2 h-2 bg-green-500 rounded-full animate-pulse" 
                    title="Panel is fixed in position"
                    style={{
                      backgroundColor: effectiveTheme === 'dark' ? '#34d399' : '#10b981'
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Sidebar Content */}
            <div className="relative">
              <DataSourceSidebar />
              <div 
                className="sticky bottom-0 left-0 right-0 h-1 pointer-events-none"
                style={{
                  background: effectiveTheme === 'dark' 
                    ? 'linear-gradient(to top, #1f2937, transparent)' 
                    : 'linear-gradient(to top, #ffffff, transparent)'
                }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Mobile/Tablet Drawer */}
        {(isMobile || isTablet) && (
          <Drawer
            title="🎛️ Data Source Controls"
            placement="right"
            onClose={() => setSidebarVisible(false)}
            open={sidebarVisible}
            width={isMobile ? '90%' : 400}
            bodyStyle={{ 
              padding: 0,
              backgroundColor: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff'
            }}
            headerStyle={{ 
              borderBottom: `2px solid ${effectiveTheme === 'dark' ? '#4b5563' : '#f0f0f0'}`,
              backgroundColor: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
              color: effectiveTheme === 'dark' ? '#ffffff' : '#000000'
            }}
            style={{
              color: effectiveTheme === 'dark' ? '#ffffff' : '#000000'
            }}
          >
            <DataSourceSidebar />
          </Drawer>
        )}
      </Layout>
      
      {/* Floating Action Buttons */}
      <FloatButton.Group
        trigger="hover"
        type="primary"
        style={{ right: isMobile ? 16 : 340 }}
        icon={<QuestionCircleOutlined />}
      >
        <FloatButton 
          tooltip="Show Help"
          onClick={showWelcomeHelp}
          icon={<QuestionCircleOutlined />}
        />
        <FloatButton 
          tooltip="Toggle Fullscreen"
          onClick={toggleFullscreen}
          icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
        />
      </FloatButton.Group>
      
      {/* Performance Monitor */}
      <PerformanceMonitor polygonCount={visiblePolygons.length} />
    </Layout>
  );
};
