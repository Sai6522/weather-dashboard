'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, useMapEvents, Polygon, Popup, useMap } from 'react-leaflet';
import { Button, Modal, Select, Input, message } from 'antd';
import L from 'leaflet';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/contexts/ThemeContext';
import { weatherApi } from '@/services/weatherApi';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DrawingHandlerProps {
  isDrawing: boolean;
  onPolygonComplete: (coordinates: [number, number][]) => void;
}

const DrawingHandler: React.FC<DrawingHandlerProps> = React.memo(({ isDrawing, onPolygonComplete }) => {
  const [currentPoints, setCurrentPoints] = useState<[number, number][]>([]);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  const map = useMapEvents({
    click: (e) => {
      if (!isDrawing) return;

      // Prevent zoom conflicts by stopping event propagation
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();

      const currentTime = Date.now();
      const timeSinceLastClick = currentTime - lastClickTime;
      
      // Ignore rapid clicks (debounce)
      if (timeSinceLastClick < 200) {
        return;
      }
      
      setLastClickTime(currentTime);

      const { lat, lng } = e.latlng;
      const newPoint: [number, number] = [lat, lng];
      
      if (!isDrawingActive) {
        // Disable map interactions during drawing
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
        
        setIsDrawingActive(true);
        setCurrentPoints([newPoint]);
      } else {
        const updatedPoints = [...currentPoints, newPoint];
        setCurrentPoints(updatedPoints);
        
        // Complete polygon when reaching max points
        if (updatedPoints.length >= 12) {
          completePolygon(updatedPoints);
        }
      }
    },
    contextmenu: (e) => {
      if (isDrawing && currentPoints.length >= 3) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
        completePolygon(currentPoints);
      }
    }
  });

  const completePolygon = (points: [number, number][]) => {
    if (points.length >= 3) {
      // Re-enable map interactions
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      
      onPolygonComplete(points);
      setCurrentPoints([]);
      setIsDrawingActive(false);
    }
  };

  useEffect(() => {
    if (!isDrawing) {
      // Re-enable all map interactions when not drawing
      if (map) {
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();
      }
      setCurrentPoints([]);
      setIsDrawingActive(false);
    }
  }, [isDrawing, map]);

  // Render current drawing polygon
  if (currentPoints.length > 0) {
    return (
      <Polygon
        positions={currentPoints}
        pathOptions={{
          color: '#ff7800',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.3,
          dashArray: '8, 8'
        }}
      />
    );
  }

  return null;
});

interface MapCenterControllerProps {
  center: [number, number];
  zoomToPolygon?: string | null;
}

const MapCenterController: React.FC<MapCenterControllerProps> = React.memo(({ center, zoomToPolygon }) => {
  const map = useMap();
  const { polygons } = useStore();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  useEffect(() => {
    if (zoomToPolygon) {
      const polygon = polygons.find(p => p.id === zoomToPolygon);
      if (polygon && polygon.coordinates.length > 0) {
        // Calculate bounds of the polygon
        const lats = polygon.coordinates.map(coord => coord[0]);
        const lngs = polygon.coordinates.map(coord => coord[1]);
        const bounds = L.latLngBounds([
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)]
        ]);
        
        // Fit the map to the polygon bounds with some padding
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [zoomToPolygon, polygons, map]);

  return null;
});

export const InteractiveMap: React.FC = () => {
  const {
    polygons: allPolygons,
    addPolygon,
    removePolygon,
    updatePolygon,
    isDrawing,
    setIsDrawing,
    mapCenter,
    setMapCenter,
    dataSources,
    timeRange,
    getVisiblePolygons
  } = useStore();

  const { effectiveTheme } = useTheme();

  // Get only visible polygons based on current time
  const polygons = getVisiblePolygons();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingPolygon, setPendingPolygon] = useState<[number, number][] | null>(null);
  const [polygonName, setPolygonName] = useState('');
  const [selectedDataSource, setSelectedDataSource] = useState<string>('');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [zoomToPolygonId, setZoomToPolygonId] = useState<string | null>(null);

  const mapRef = useRef<L.Map>(null);

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

  const handlePolygonComplete = useCallback((coordinates: [number, number][]) => {
    setPendingPolygon(coordinates);
    setPolygonName(`Polygon ${polygons.length + 1}`);
    setSelectedDataSource(dataSources[0]?.id || '');
    setIsModalVisible(true);
    setIsDrawing(false);
  }, [polygons.length, dataSources, setIsDrawing]);

  const calculateCentroid = useCallback((coordinates: [number, number][]): [number, number] => {
    const lat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
    const lng = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
    return [lat, lng];
  }, []);

  const determinePolygonColor = useCallback((value: number | null, colorRules: any[]): string => {
    if (value === null || value === undefined) return '#gray';
    
    // Sort rules by value in descending order to check highest thresholds first
    const sortedRules = [...colorRules].sort((a, b) => b.value - a.value);
    
    for (const rule of sortedRules) {
      switch (rule.operator) {
        case '>=':
          if (value >= rule.value) return rule.color;
          break;
        case '>':
          if (value > rule.value) return rule.color;
          break;
        case '<=':
          if (value <= rule.value) return rule.color;
          break;
        case '<':
          if (value < rule.value) return rule.color;
          break;
        case '=':
          if (Math.abs(value - rule.value) < 0.1) return rule.color;
          break;
      }
    }
    
    return '#808080'; // Default gray
  }, []);

  const handlePolygonSave = useCallback(async () => {
    if (!pendingPolygon || !selectedDataSource) return;

    const polygonId = `polygon-${Date.now()}`;
    
    // Calculate centroid for initial data fetch
    const centroid = calculateCentroid(pendingPolygon);
    
    try {
      // Fetch initial temperature data
      const temperature = await weatherApi.getTemperatureForTimeRange(
        centroid[0],
        centroid[1],
        timeRange.start,
        timeRange.end
      );

      // Determine color based on data source rules
      const dataSource = dataSources.find(ds => ds.id === selectedDataSource);
      const color = determinePolygonColor(temperature, dataSource?.colorRules || []);

      const newPolygon = {
        id: polygonId,
        name: polygonName,
        coordinates: pendingPolygon,
        dataSourceId: selectedDataSource,
        color,
        currentValue: temperature || undefined,
        createdAt: timeRange.mode === 'range' ? timeRange.end : timeRange.start // Use current selected time as creation time
      };

      addPolygon(newPolygon);
      showMessage('success', 'Polygon created successfully!');
    } catch (error) {
      showMessage('error', 'Failed to fetch weather data for polygon');
      console.error(error);
    }

    setIsModalVisible(false);
    setPendingPolygon(null);
    setPolygonName('');
  }, [pendingPolygon, selectedDataSource, polygonName, calculateCentroid, timeRange, dataSources, determinePolygonColor, addPolygon]);

  // Listen for polygon navigation requests from the store
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'navigate-to-polygon' && e.newValue) {
        const polygonId = e.newValue;
        setZoomToPolygonId(polygonId);
        // Clear the navigation request
        localStorage.removeItem('navigate-to-polygon');
        // Reset zoom state after a delay
        setTimeout(() => setZoomToPolygonId(null), 1000);
      }
    };

    const handleCustomNavigationEvent = (e: CustomEvent) => {
      const polygonId = e.detail;
      setZoomToPolygonId(polygonId);
      setTimeout(() => setZoomToPolygonId(null), 1000);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('navigate-to-polygon', handleCustomNavigationEvent as EventListener);
    
    // Also check for direct navigation requests
    const checkNavigationRequest = () => {
      const navigationRequest = localStorage.getItem('navigate-to-polygon');
      if (navigationRequest) {
        setZoomToPolygonId(navigationRequest);
        localStorage.removeItem('navigate-to-polygon');
        setTimeout(() => setZoomToPolygonId(null), 1000);
      }
    };

    const interval = setInterval(checkNavigationRequest, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('navigate-to-polygon', handleCustomNavigationEvent as EventListener);
      clearInterval(interval);
    };
  }, []);

  // Update polygon colors when time range changes - optimized with batch processing
  useEffect(() => {
    const updatePolygonColors = async () => {
      if (polygons.length === 0) return;

      try {
        // Prepare locations for batch processing (only for visible polygons)
        const locations = polygons.map(polygon => {
          const centroid = calculateCentroid(polygon.coordinates);
          return {
            id: polygon.id,
            latitude: centroid[0],
            longitude: centroid[1]
          };
        });

        // Use batch API call for better performance
        const temperatureResults = await weatherApi.batchGetTemperatures(
          locations,
          timeRange.start,
          timeRange.end
        );

        // Update all visible polygons at once
        const updates = polygons.map(polygon => {
          const temperature = temperatureResults.get(polygon.id) ?? null;
          const dataSource = dataSources.find(ds => ds.id === polygon.dataSourceId);
          const color = determinePolygonColor(temperature, dataSource?.colorRules || []);

          return {
            id: polygon.id,
            updates: { 
              color, 
              currentValue: temperature || undefined 
            }
          };
        });

        // Batch update all polygons
        updates.forEach(({ id, updates }) => {
          updatePolygon(id, updates);
        });

      } catch (error) {
        console.error('Failed to update polygon colors:', error);
      }
    };

    // Debounce the update to avoid too frequent API calls
    const timeoutId = setTimeout(updatePolygonColors, 300);
    return () => clearTimeout(timeoutId);
  }, [timeRange, polygons.length, dataSources, calculateCentroid, determinePolygonColor, updatePolygon]);

  const resetMapCenter = useCallback(() => {
    setMapCenter([52.5200, 13.4050]); // Berlin
  }, [setMapCenter]);

  // Handle cursor changes for drawing mode
  useEffect(() => {
    const mapContainer = document.querySelector('.leaflet-container') as HTMLElement;
    if (mapContainer) {
      mapContainer.style.cursor = isDrawing ? 'crosshair' : 'grab';
      
      // Add drawing class for additional styling
      if (isDrawing) {
        mapContainer.classList.add('drawing-mode');
      } else {
        mapContainer.classList.remove('drawing-mode');
      }
    }
  }, [isDrawing]);

  const handleMapMove = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      setMapCenter([center.lat, center.lng]);
    }
  };

  // Memoize polygon components for better performance
  const memoizedPolygons = useMemo(() => {
    return polygons.map((polygon) => (
      <Polygon
        key={polygon.id}
        positions={polygon.coordinates}
        pathOptions={{
          color: polygon.color,
          weight: 3,
          opacity: 0.8,
          fillOpacity: 0.4
        }}
      >
        <Popup>
          <div>
            <h4>{polygon.name}</h4>
            <p>Temperature: {polygon.currentValue?.toFixed(1) || 'N/A'}°C</p>
            <Button 
              size="small" 
              danger 
              onClick={() => removePolygon(polygon.id)}
            >
              Delete
            </Button>
          </div>
        </Popup>
      </Polygon>
    ));
  }, [polygons, removePolygon]);

  // Memoize map controls for better performance
  const mapControls = useMemo(() => {
    const isMobile = window.innerWidth < 768;
    
    return (
      <div className="map-controls" style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 1000,
        display: 'flex',
        gap: isMobile ? '8px' : '12px',
        flexWrap: 'wrap',
        maxWidth: isMobile ? 'calc(100% - 32px)' : 'auto'
      }}>
        <Button
          type={isDrawing ? 'primary' : 'default'}
          size={isMobile ? 'middle' : 'large'}
          onClick={() => setIsDrawing(!isDrawing)}
          disabled={isDrawing && pendingPolygon !== null}
          style={{
            backgroundColor: isDrawing 
              ? (effectiveTheme === 'dark' ? '#3b82f6' : '#1890ff')
              : (effectiveTheme === 'dark' ? '#374151' : '#ffffff'),
            borderColor: effectiveTheme === 'dark' ? '#60a5fa' : '#1890ff',
            color: isDrawing 
              ? '#ffffff' 
              : (effectiveTheme === 'dark' ? '#ffffff' : '#1890ff'),
            fontWeight: 600,
            fontSize: isMobile ? '14px' : '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            minWidth: isMobile ? 'auto' : '140px',
            textShadow: isDrawing || effectiveTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
            border: '2px solid'
          }}
        >
          {isDrawing ? (isMobile ? '🚫' : '🚫 Cancel') : (isMobile ? '✏️' : '✏️ Draw Polygon')}
        </Button>
        
        <Button 
          size={isMobile ? 'middle' : 'large'}
          onClick={resetMapCenter}
          style={{
            backgroundColor: effectiveTheme === 'dark' ? '#374151' : '#ffffff',
            borderColor: effectiveTheme === 'dark' ? '#34d399' : '#52c41a',
            color: effectiveTheme === 'dark' ? '#ffffff' : '#52c41a',
            fontWeight: 600,
            fontSize: isMobile ? '14px' : '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            minWidth: isMobile ? 'auto' : '120px',
            textShadow: effectiveTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
            border: '2px solid'
          }}
        >
          {isMobile ? '🎯' : '🎯 Reset Center'}
        </Button>

        {polygons.length > 0 && (
          <Button
            size={isMobile ? 'middle' : 'large'}
            danger
            onClick={() => {
              if (confirm('Delete all polygons?')) {
                polygons.forEach(p => removePolygon(p.id));
              }
            }}
            style={{
              backgroundColor: effectiveTheme === 'dark' ? '#dc2626' : '#ffffff',
              borderColor: effectiveTheme === 'dark' ? '#ef4444' : '#ff4d4f',
              color: effectiveTheme === 'dark' ? '#ffffff' : '#ff4d4f',
              fontWeight: 600,
              fontSize: isMobile ? '14px' : '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              minWidth: isMobile ? 'auto' : '140px',
              textShadow: effectiveTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
              border: '2px solid'
            }}
          >
            {isMobile ? `🗑️ ${polygons.length}` : `🗑️ Clear All (${polygons.length})`}
          </Button>
        )}
      </div>
    );
  }, [isDrawing, pendingPolygon, polygons.length, setIsDrawing, resetMapCenter, removePolygon, effectiveTheme]);

  // Ensure map loads properly
  useEffect(() => {
    const checkMapLoading = () => {
      const mapContainer = document.querySelector('.leaflet-container');
      if (mapContainer && !isMapLoaded) {
        // Force map loaded state after a delay if container exists
        setTimeout(() => {
          setIsMapLoaded(true);
          mapContainer.classList.add('map-fully-loaded');
          mapContainer.setAttribute('data-map-loaded', 'true');
        }, 1000);
      }
    };

    const timer = setTimeout(checkMapLoading, 2000);
    return () => clearTimeout(timer);
  }, [isMapLoaded]);

  return (
    <div className="map-wrapper" style={{ position: 'relative', height: '600px' }}>
      {/* Map Controls - Memoized for better performance */}
      {mapControls}

      {/* Drawing Instructions - More visible and responsive */}
      {isDrawing && (
        <div className="drawing-instructions" style={{
          position: 'absolute',
          top: window.innerWidth < 768 ? '70px' : '80px',
          left: '16px',
          right: window.innerWidth < 768 ? '16px' : 'auto',
          zIndex: 1000,
          background: effectiveTheme === 'dark' 
            ? 'rgba(59, 130, 246, 0.95)' 
            : 'rgba(24, 144, 255, 0.95)',
          color: '#ffffff',
          padding: window.innerWidth < 768 ? '12px' : '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          maxWidth: window.innerWidth < 768 ? 'none' : '320px',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          fontSize: window.innerWidth < 768 ? '14px' : '16px'
        }}>
          <div className="text-sm font-medium">
            <div className="mb-2 text-lg" style={{ fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              🖱️ <strong>Drawing Mode Active</strong>
            </div>
            <div className="mb-1" style={{ fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              • <strong>{window.innerWidth < 768 ? 'Tap' : 'Left-click'}</strong> to add points (min: 3, max: 12)
            </div>
            <div className="mb-1" style={{ fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              • <strong>Right-click</strong> to complete polygon
            </div>
            <div className="mb-1" style={{ fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              • Map zoom/pan is <strong>disabled</strong> while drawing
            </div>
            <div className="mb-2" style={{ fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              • Click "Cancel" to stop and re-enable map
            </div>
            <div 
              className="text-xs p-2 rounded"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                fontWeight: 600,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              💡 <strong>Tip:</strong> {window.innerWidth < 768 ? 'Tap slowly and deliberately' : 'Click slowly and deliberately. Avoid rapid clicking'}.
            </div>
          </div>
        </div>
      )}

      {/* Status Info - Responsive */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        right: window.innerWidth < 768 ? '16px' : 'auto',
        zIndex: 1000,
        background: effectiveTheme === 'dark' 
          ? 'rgba(31, 41, 55, 0.95)' 
          : 'rgba(255, 255, 255, 0.95)',
        padding: window.innerWidth < 768 ? '8px 12px' : '10px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        fontSize: window.innerWidth < 768 ? '11px' : '13px',
        color: effectiveTheme === 'dark' ? '#ffffff' : '#000000',
        backdropFilter: 'blur(8px)',
        maxWidth: window.innerWidth < 768 ? 'none' : '400px',
        border: `2px solid ${effectiveTheme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
        fontWeight: 600,
        textShadow: effectiveTheme === 'dark' 
          ? '0 1px 2px rgba(0,0,0,0.5)' 
          : '0 1px 2px rgba(255,255,255,0.5)'
      }}>
        <div className={window.innerWidth < 768 ? 'text-center' : ''}>
          📍 Center: {mapCenter[0].toFixed(3)}, {mapCenter[1].toFixed(3)} | 
          🔺 Polygons: {polygons.length} | 
          📊 Sources: {dataSources.length}
          {window.innerWidth >= 768 && ` | 🕒 ${timeRange.mode === 'single' ? 'Single' : 'Range'} Mode`}
        </div>
      </div>

      {/* Map Container */}
      <div className="map-container" style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '2px solid #e5e7eb'
      }}>
        {!isMapLoaded && (
          <div 
            className="map-loading-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(248, 249, 250, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              fontSize: '18px',
              color: '#666'
            }}
          >
            <div className="mb-4 text-4xl">🗺️</div>
            <div className="font-medium">Loading interactive map...</div>
            <div className="text-sm mt-2 text-gray-500">Please wait while we initialize the map</div>
          </div>
        )}
        
        <MapContainer
          center={mapCenter}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          zoomControl={true}
          doubleClickZoom={false} // Disable double-click zoom to prevent conflicts
          touchZoom={true}
          scrollWheelZoom={true}
          dragging={true}
          zoomSnap={0.5} // Smoother zoom levels
          zoomDelta={0.5} // Smaller zoom increments
          wheelPxPerZoomLevel={120} // Less sensitive wheel zoom
          whenReady={() => {
            if (mapRef.current) {
              mapRef.current.on('moveend', handleMapMove);
              
              // Configure zoom behavior
              mapRef.current.options.zoomSnap = 0.5;
              mapRef.current.options.zoomDelta = 0.5;
              
              // Set map as loaded when ready
              setIsMapLoaded(true);
              const container = mapRef.current.getContainer();
              if (container) {
                container.classList.add('map-fully-loaded');
                container.setAttribute('data-map-loaded', 'true');
                
                // Add custom CSS for better drawing experience
                container.style.cursor = isDrawing ? 'crosshair' : 'grab';
              }
            }
          }}
        >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapCenterController center={mapCenter} zoomToPolygon={zoomToPolygonId} />
        
        <DrawingHandler
          isDrawing={isDrawing}
          onPolygonComplete={handlePolygonComplete}
        />

        {memoizedPolygons}
      </MapContainer>
      </div>

      <Modal
        title="Configure Polygon"
        open={isModalVisible}
        onOk={handlePolygonSave}
        onCancel={() => {
          setIsModalVisible(false);
          setPendingPolygon(null);
        }}
        okText="Create Polygon"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Polygon Name</label>
            <Input
              value={polygonName}
              onChange={(e) => setPolygonName(e.target.value)}
              placeholder="Enter polygon name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data Source</label>
            <Select
              value={selectedDataSource}
              onChange={setSelectedDataSource}
              className="w-full"
              placeholder="Select data source"
            >
              {dataSources.map((ds) => (
                <Select.Option key={ds.id} value={ds.id}>
                  {ds.name}
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
