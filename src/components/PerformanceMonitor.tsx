'use client';

import React, { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Button } from 'antd';
import { weatherApi } from '@/services/weatherApi';

interface PerformanceStats {
  renderTime: number;
  apiCalls: number;
  cacheHitRate: string;
  memoryUsage: number;
  polygonCount: number;
}

export const PerformanceMonitor: React.FC<{ polygonCount: number }> = React.memo(({ polygonCount }) => {
  const [stats, setStats] = useState<PerformanceStats>({
    renderTime: 0,
    apiCalls: 0,
    cacheHitRate: '0%',
    memoryUsage: 0,
    polygonCount: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const cacheStats = weatherApi.getCacheStats();
      
      setStats({
        renderTime: performance.now(),
        apiCalls: cacheStats.totalEntries,
        cacheHitRate: cacheStats.cacheHitRate,
        memoryUsage: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0,
        polygonCount
      });
    };

    if (isVisible) {
      updateStats();
      const interval = setInterval(updateStats, 2000);
      return () => clearInterval(interval);
    }
  }, [isVisible, polygonCount]);

  if (!isVisible) {
    return (
      <Button
        size="small"
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          opacity: 0.7
        }}
      >
        📊 Performance
      </Button>
    );
  }

  return (
    <Card
      title="Performance Monitor"
      size="small"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '300px',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}
      extra={
        <Button size="small" onClick={() => setIsVisible(false)}>
          ✕
        </Button>
      }
    >
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title="API Cache"
            value={stats.cacheHitRate}
            precision={0}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Polygons"
            value={stats.polygonCount}
            precision={0}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Memory (MB)"
            value={stats.memoryUsage}
            precision={1}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Cache Entries"
            value={stats.apiCalls}
            precision={0}
          />
        </Col>
      </Row>
    </Card>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';
