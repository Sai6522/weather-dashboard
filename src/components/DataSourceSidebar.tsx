'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, List, ColorPicker, Select, InputNumber, Space, Typography, Divider, Tag, Alert, message, Dropdown, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, SettingOutlined, CopyOutlined, EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorRule, DataSource, Polygon } from '@/store/useStore';

const { Title, Text } = Typography;
const { Option } = Select;

export const DataSourceSidebar: React.FC = () => {
  const { 
    dataSources, 
    addDataSource, 
    updateDataSource, 
    deleteDataSource, 
    polygons: allPolygons, 
    getVisiblePolygons,
    navigateToPolygon,
    timeRange,
    clearAllPolygons
  } = useStore();

  const { effectiveTheme } = useTheme();
  
  // Get visible polygons based on current time
  const visiblePolygons = getVisiblePolygons();
  const currentTime = timeRange.mode === 'range' ? timeRange.end : timeRange.start;
  
  // State for timeline filter
  const [timelineFilter, setTimelineFilter] = useState<string>('all');
  const [filteredPolygons, setFilteredPolygons] = useState<Polygon[]>(visiblePolygons);

  // Helper function for theme-aware messages
  const showMessage = (type: 'success' | 'warning' | 'info' | 'error', content: string, duration = 3) => {
    const isDark = effectiveTheme === 'dark';
    
    message[type]({
      content,
      duration,
      style: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        border: `2px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
        color: isDark ? '#ffffff' : '#000000',
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
        fontWeight: '600'
      },
      className: isDark ? 'dark-theme-message' : 'light-theme-message'
    });
  };

  // Generate timeline filter options based on polygon creation dates
  const getTimelineOptions = () => {
    if (allPolygons.length === 0) return [];

    // Group polygons by creation date
    const dateGroups = new Map<string, Polygon[]>();
    
    allPolygons.forEach(polygon => {
      const dateKey = new Date(polygon.createdAt).toDateString();
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, []);
      }
      dateGroups.get(dateKey)!.push(polygon);
    });

    // Sort dates and create options
    const sortedDates = Array.from(dateGroups.keys()).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    const options = [
      { value: 'all', label: `All Visible (${visiblePolygons.length})` },
      { value: 'today', label: 'Created Today' },
      { value: 'yesterday', label: 'Created Yesterday' },
      { value: 'last7days', label: 'Last 7 Days' },
      { value: 'last30days', label: 'Last 30 Days' },
    ];

    // Add specific date options
    sortedDates.forEach(dateStr => {
      const count = dateGroups.get(dateStr)!.filter(p => visiblePolygons.includes(p)).length;
      if (count > 0) {
        const date = new Date(dateStr);
        const formattedDate = date.toLocaleDateString();
        options.push({
          value: `date_${dateStr}`,
          label: `${formattedDate} (${count})`
        });
      }
    });

    return options;
  };

  // Filter polygons based on timeline selection
  const filterPolygonsByTimeline = (filter: string, polygons: Polygon[]): Polygon[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (filter) {
      case 'all':
        return polygons;
      case 'today':
        return polygons.filter(p => new Date(p.createdAt) >= today);
      case 'yesterday':
        return polygons.filter(p => {
          const createdDate = new Date(p.createdAt);
          return createdDate >= yesterday && createdDate < today;
        });
      case 'last7days':
        return polygons.filter(p => new Date(p.createdAt) >= last7Days);
      case 'last30days':
        return polygons.filter(p => new Date(p.createdAt) >= last30Days);
      default:
        if (filter.startsWith('date_')) {
          const targetDate = filter.replace('date_', '');
          return polygons.filter(p => new Date(p.createdAt).toDateString() === targetDate);
        }
        return polygons;
    }
  };

  // Update filtered polygons when timeline filter or visible polygons change
  useEffect(() => {
    const filtered = filterPolygonsByTimeline(timelineFilter, visiblePolygons);
    setFilteredPolygons(filtered);
  }, [timelineFilter, visiblePolygons]);

  // Reset filter when no polygons are visible
  useEffect(() => {
    if (visiblePolygons.length === 0) {
      setTimelineFilter('all');
    }
  }, [visiblePolygons.length]);
  const [isAddingDataSource, setIsAddingDataSource] = useState(false);
  const [newDataSourceName, setNewDataSourceName] = useState('');
  const [newDataSourceField, setNewDataSourceField] = useState('temperature_2m');

  const handleAddDataSource = () => {
    if (!newDataSourceName.trim()) return;

    const newDataSource: DataSource = {
      id: `ds-${Date.now()}`,
      name: newDataSourceName,
      field: newDataSourceField,
      colorRules: [
        { id: '1', operator: '<', value: 0, color: '#3b82f6' },
        { id: '2', operator: '>=', value: 0, color: '#10b981' },
        { id: '3', operator: '>=', value: 20, color: '#f59e0b' },
        { id: '4', operator: '>=', value: 30, color: '#ef4444' },
      ]
    };

    addDataSource(newDataSource);
    setNewDataSourceName('');
    setIsAddingDataSource(false);
  };

  const handleAddColorRule = (dataSourceId: string) => {
    const dataSource = dataSources.find(ds => ds.id === dataSourceId);
    if (!dataSource) return;

    const newRule: ColorRule = {
      id: `rule-${Date.now()}`,
      operator: '>=',
      value: 0,
      color: '#808080'
    };

    updateDataSource(dataSourceId, {
      colorRules: [...dataSource.colorRules, newRule]
    });
  };

  const handleUpdateColorRule = (dataSourceId: string, ruleId: string, updates: Partial<ColorRule>) => {
    const dataSource = dataSources.find(ds => ds.id === dataSourceId);
    if (!dataSource) return;

    const updatedRules = dataSource.colorRules.map(rule =>
      rule.id === ruleId ? { ...rule, ...updates } : rule
    );

    updateDataSource(dataSourceId, { colorRules: updatedRules });
  };

  const handleDeleteColorRule = (dataSourceId: string, ruleId: string) => {
    const dataSource = dataSources.find(ds => ds.id === dataSourceId);
    if (!dataSource) return;

    const updatedRules = dataSource.colorRules.filter(rule => rule.id !== ruleId);
    updateDataSource(dataSourceId, { colorRules: updatedRules });
  };

  const getOperatorLabel = (operator: string) => {
    const labels = {
      '=': 'equals',
      '<': 'less than',
      '>': 'greater than',
      '<=': 'less or equal',
      '>=': 'greater or equal'
    };
    return labels[operator as keyof typeof labels] || operator;
  };

  const handleDeleteDataSource = (dataSourceId: string, dataSourceName: string) => {
    // Prevent deleting the last data source
    if (dataSources.length <= 1) {
      showMessage('warning', 'Cannot delete the last data source. At least one data source is required.');
      return;
    }

    const polygonsUsingSource = allPolygons.filter(p => p.dataSourceId === dataSourceId);
    
    Modal.confirm({
      title: 'Delete Data Source',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to delete the data source <strong>"{dataSourceName}"</strong>?</p>
          {polygonsUsingSource.length > 0 && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 text-sm">
                ⚠️ This will also remove <strong>{polygonsUsingSource.length}</strong> polygon(s) that use this data source:
              </p>
              <ul className="text-yellow-700 text-xs mt-1">
                {polygonsUsingSource.map(p => (
                  <li key={p.id}>• {p.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        deleteDataSource(dataSourceId);
        showMessage('success', `Data source "${dataSourceName}" deleted successfully`);
      },
    });
  };

  const handleDuplicateDataSource = (dataSource: DataSource) => {
    const newDataSource: DataSource = {
      ...dataSource,
      id: `ds-${Date.now()}`,
      name: `${dataSource.name} (Copy)`,
      colorRules: dataSource.colorRules.map(rule => ({
        ...rule,
        id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
    };
    
    addDataSource(newDataSource);
    showMessage('success', `Data source duplicated as "${newDataSource.name}"`);
  };

  const handleResetColorRules = (dataSourceId: string) => {
    const defaultRules: ColorRule[] = [
      { id: '1', operator: '<', value: 0, color: '#3b82f6' },
      { id: '2', operator: '>=', value: 0, color: '#10b981' },
      { id: '3', operator: '>=', value: 20, color: '#f59e0b' },
      { id: '4', operator: '>=', value: 30, color: '#ef4444' },
    ];
    
    updateDataSource(dataSourceId, { colorRules: defaultRules });
    showMessage('success', 'Color rules reset to default');
  };

  const handleClearAllPolygons = () => {
    if (allPolygons.length === 0) {
      showMessage('info', 'No polygons to clear');
      return;
    }

    Modal.confirm({
      title: 'Clear All Polygons',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to delete <strong>all {allPolygons.length} polygon(s)</strong>?</p>
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 text-sm">
              ⚠️ This action cannot be undone. All polygon data will be permanently lost.
            </p>
          </div>
        </div>
      ),
      okText: 'Delete All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        clearAllPolygons();
        showMessage('success', `All ${allPolygons.length} polygons deleted successfully`);
      },
    });
  };

  const getDataSourceMenu = (dataSource: DataSource): MenuProps['items'] => {
    const polygonsUsingSource = allPolygons.filter(p => p.dataSourceId === dataSource.id);
    const isLastDataSource = dataSources.length <= 1;
    
    return [
      {
        key: 'duplicate',
        label: 'Duplicate Data Source',
        icon: <CopyOutlined />,
        onClick: () => handleDuplicateDataSource(dataSource),
      },
      {
        key: 'reset-rules',
        label: 'Reset Color Rules',
        icon: <EditOutlined />,
        onClick: () => handleResetColorRules(dataSource.id),
      },
      {
        type: 'divider',
      },
      {
        key: 'delete',
        label: (
          <span style={{ color: isLastDataSource ? '#d9d9d9' : '#ff4d4f' }}>
            Delete Data Source
            {polygonsUsingSource.length > 0 && (
              <span className="text-xs"> ({polygonsUsingSource.length} polygons)</span>
            )}
            {isLastDataSource && <span className="text-xs"> (Last data source)</span>}
          </span>
        ),
        icon: <DeleteOutlined style={{ color: isLastDataSource ? '#d9d9d9' : '#ff4d4f' }} />,
        disabled: isLastDataSource,
        onClick: () => handleDeleteDataSource(dataSource.id, dataSource.name),
      },
    ];
  };

  return (
    <div className="p-4 h-full overflow-auto bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <Title level={4} className="text-blue-600 mb-2">
          🎛️ Data Source Controls
        </Title>
        <Text className="text-gray-600">
          Configure data sources and color rules for polygon visualization
        </Text>
        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
          <div className="text-xs text-blue-800">
            <strong>📅 Current Time:</strong> {currentTime.toLocaleString()}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Only polygons created at or before this time are visible
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <Alert
        message={`${dataSources.length} data sources • ${visiblePolygons.length}/${allPolygons.length} polygons visible`}
        type="info"
        showIcon
        className="mb-4"
      />

      {/* Timeline Filter */}
      {visiblePolygons.length > 0 && (
        <Card title="📅 Filter by Creation Time" size="small" className="mb-4">
          <div className="space-y-3">
            <div>
              <Text strong className="text-sm">Show polygons:</Text>
              <Select
                value={timelineFilter}
                onChange={setTimelineFilter}
                className="w-full mt-1"
                placeholder="Select time period"
              >
                {getTimelineOptions().map(option => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </div>
            
            {timelineFilter !== 'all' && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                Showing {filteredPolygons.length} of {visiblePolygons.length} visible polygons
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Clear All Polygons Button */}
      {allPolygons.length > 0 && (
        <Card size="small" className="mb-4">
          <Button
            danger
            block
            icon={<DeleteOutlined />}
            onClick={handleClearAllPolygons}
            size="large"
          >
            🗑️ Clear All Polygons ({allPolygons.length})
          </Button>
          <div className="text-xs text-gray-500 mt-2 text-center">
            Remove all polygons from the map and storage
          </div>
        </Card>
      )}

      {/* Add Data Source */}
      <Card 
        title="➕ Add Data Source" 
        size="small" 
        className="mb-4"
        extra={
          <Button 
            type="primary" 
            size="small"
            onClick={() => setIsAddingDataSource(!isAddingDataSource)}
          >
            {isAddingDataSource ? 'Cancel' : 'Add New'}
          </Button>
        }
      >
        {isAddingDataSource && (
          <Space direction="vertical" className="w-full">
            <div>
              <Text strong>Name:</Text>
              <input
                type="text"
                value={newDataSourceName}
                onChange={(e) => setNewDataSourceName(e.target.value)}
                placeholder="e.g., Temperature"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <Text strong>Field:</Text>
              <Select
                value={newDataSourceField}
                onChange={setNewDataSourceField}
                className="w-full mt-1"
              >
                <Option value="temperature_2m">Temperature (°C)</Option>
                <Option value="relative_humidity_2m">Humidity (%)</Option>
                <Option value="precipitation">Precipitation (mm)</Option>
                <Option value="windspeed_10m">Wind Speed (km/h)</Option>
                <Option value="pressure_msl">Pressure (hPa)</Option>
              </Select>
            </div>
            <Button 
              type="primary" 
              onClick={handleAddDataSource}
              disabled={!newDataSourceName.trim()}
              block
            >
              Create Data Source
            </Button>
          </Space>
        )}
      </Card>

      {/* Data Sources List */}
      <div className="space-y-4">
        {dataSources.map((dataSource) => {
          const polygonsUsingSource = filteredPolygons.filter(p => p.dataSourceId === dataSource.id);
          const visiblePolygonsUsingSource = visiblePolygons.filter(p => p.dataSourceId === dataSource.id);
          const totalPolygonsUsingSource = allPolygons.filter(p => p.dataSourceId === dataSource.id);
          
          return (
            <Card
              key={dataSource.id}
              title={
                <div className="flex items-center justify-between">
                  <span className="font-medium">{dataSource.name}</span>
                  <div className="flex gap-1">
                    <Tag color="green">{polygonsUsingSource.length} shown</Tag>
                    {visiblePolygonsUsingSource.length !== polygonsUsingSource.length && (
                      <Tag color="blue">{visiblePolygonsUsingSource.length} visible</Tag>
                    )}
                    {totalPolygonsUsingSource.length > visiblePolygonsUsingSource.length && (
                      <Tag color="gray">{totalPolygonsUsingSource.length} total</Tag>
                    )}
                  </div>
                </div>
              }
              size="small"
              className="shadow-sm"
              extra={
                <Dropdown
                  menu={{ items: getDataSourceMenu(dataSource) }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <Button
                    type="text"
                    icon={<SettingOutlined />}
                    size="small"
                    className="hover:bg-gray-100"
                    title="Data source options"
                  />
                </Dropdown>
              }
            >
              <div className="space-y-3">
                <div className="text-xs text-gray-500">
                  Field: <code className="bg-gray-100 px-1 rounded">{dataSource.field}</code>
                </div>

                {/* Color Rules */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Text strong className="text-sm">Color Rules:</Text>
                    <Button
                      type="dashed"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddColorRule(dataSource.id)}
                    >
                      Add Rule
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {dataSource.colorRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded border"
                      >
                        <ColorPicker
                          value={rule.color}
                          onChange={(color) =>
                            handleUpdateColorRule(dataSource.id, rule.id, {
                              color: color.toHexString()
                            })
                          }
                          size="small"
                        />

                        <Select
                          value={rule.operator}
                          onChange={(operator) =>
                            handleUpdateColorRule(dataSource.id, rule.id, { operator })
                          }
                          size="small"
                          style={{ width: 60 }}
                        >
                          <Option value="<">&lt;</Option>
                          <Option value="<=">&le;</Option>
                          <Option value="=">=</Option>
                          <Option value=">=">&ge;</Option>
                          <Option value=">">&gt;</Option>
                        </Select>

                        <InputNumber
                          value={rule.value}
                          onChange={(value) =>
                            handleUpdateColorRule(dataSource.id, rule.id, { value: value || 0 })
                          }
                          size="small"
                          style={{ width: 70 }}
                        />

                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteColorRule(dataSource.id, rule.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rule Preview */}
                {dataSource.colorRules.length > 0 && (
                  <div className="text-xs">
                    <Text className="text-gray-500">Preview:</Text>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dataSource.colorRules.map((rule) => (
                        <div
                          key={rule.id}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: rule.color + '20', border: `1px solid ${rule.color}` }}
                        >
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: rule.color }}
                          />
                          <span>{getOperatorLabel(rule.operator)} {rule.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Active Polygons */}
      {filteredPolygons.length > 0 && (
        <>
          <Divider />
          <Card 
            title={
              <div className="flex items-center justify-between">
                <span>🔺 Active Polygons</span>
                <div className="flex gap-1">
                  <Tag color="green">{filteredPolygons.length} shown</Tag>
                  {filteredPolygons.length !== visiblePolygons.length && (
                    <Tag color="blue">{visiblePolygons.length} visible</Tag>
                  )}
                </div>
              </div>
            } 
            size="small"
          >
            <div className="mb-2 text-xs text-gray-500">
              Click on any polygon to navigate to its location on the map
            </div>
            <List
              size="small"
              dataSource={filteredPolygons}
              renderItem={(polygon) => {
                const dataSource = dataSources.find(ds => ds.id === polygon.dataSourceId);
                const creationTime = new Date(polygon.createdAt).toLocaleString();
                const isRecent = new Date().getTime() - new Date(polygon.createdAt).getTime() < 24 * 60 * 60 * 1000;
                
                return (
                  <List.Item className="px-0">
                    <div 
                      className="flex items-center justify-between w-full cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors border border-transparent hover:border-blue-200"
                      onClick={() => {
                        navigateToPolygon(polygon.id);
                        showMessage('success', `Navigating to ${polygon.name}`, 1);
                        // Visual feedback
                        const element = document.activeElement as HTMLElement;
                        if (element) element.blur();
                      }}
                      title="Click to navigate to this polygon on the map"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.05) 100%)'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border shadow-sm"
                          style={{ backgroundColor: polygon.color }}
                        />
                        <div>
                          <div className="font-medium text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            📍 {polygon.name}
                            {isRecent && <span className="text-xs bg-green-100 text-green-600 px-1 rounded">NEW</span>}
                          </div>
                          <div className="text-xs text-gray-500">
                            {dataSource?.name} • {polygon.currentValue?.toFixed(1) || 'N/A'}
                            {dataSource?.field === 'temperature_2m' && '°C'}
                            {dataSource?.field === 'relative_humidity_2m' && '%'}
                            {dataSource?.field === 'precipitation' && 'mm'}
                            {dataSource?.field === 'windspeed_10m' && 'km/h'}
                            {dataSource?.field === 'pressure_msl' && 'hPa'}
                          </div>
                          <div className="text-xs text-gray-400">
                            Created: {creationTime}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-blue-500 opacity-70">
                        🎯 Click to view
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </Card>
        </>
      )}

      {/* No Filtered Polygons Message */}
      {visiblePolygons.length > 0 && filteredPolygons.length === 0 && (
        <>
          <Divider />
          <Card title="🔺 Active Polygons" size="small">
            <div className="text-center py-4 text-gray-500">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-sm">No polygons match the selected time filter</div>
              <div className="text-xs mt-1">
                Try selecting a different time period or "All Visible"
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Hidden Polygons Info */}
      {allPolygons.length > visiblePolygons.length && (
        <Card 
          title="👻 Hidden Polygons" 
          size="small" 
          className="mt-4"
          style={{ opacity: 0.7 }}
        >
          <div className="text-sm text-gray-600">
            {allPolygons.length - visiblePolygons.length} polygon(s) are hidden because they were created after the current selected time.
          </div>
          <div className="text-xs text-gray-500 mt-2">
            💡 Move the timeline forward to see polygons created in the future.
          </div>
        </Card>
      )}

      {/* Help */}
      <Card title="💡 Quick Tips" size="small" className="mt-4">
        <div className="text-xs space-y-2 text-gray-600">
          <div>• Click "Draw Polygon" on the map to create regions</div>
          <div>• Color rules are applied in order from top to bottom</div>
          <div>• Use the timeline to see data changes over time</div>
          <div>• Polygons automatically update colors based on weather data</div>
        </div>
      </Card>
    </div>
  );
};
