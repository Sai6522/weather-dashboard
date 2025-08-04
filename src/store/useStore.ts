import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ColorRule {
  id: string;
  operator: '=' | '<' | '>' | '<=' | '>=';
  value: number;
  color: string;
}

export interface DataSource {
  id: string;
  name: string;
  field: string;
  colorRules: ColorRule[];
}

export interface Polygon {
  id: string;
  name: string;
  coordinates: [number, number][];
  dataSourceId: string;
  color: string;
  currentValue?: number;
  createdAt: Date; // New field for creation timestamp
}

export interface TimeRange {
  start: Date;
  end: Date;
  mode: 'single' | 'range';
}

interface StoreState {
  // Timeline
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  
  // Polygons
  polygons: Polygon[];
  addPolygon: (polygon: Polygon) => void;
  removePolygon: (id: string) => void;
  updatePolygon: (id: string, updates: Partial<Polygon>) => void;
  clearAllPolygons: () => void;
  
  // Data Sources
  dataSources: DataSource[];
  addDataSource: (dataSource: DataSource) => void;
  updateDataSource: (id: string, updates: Partial<DataSource>) => void;
  deleteDataSource: (id: string) => void;
  
  // Drawing mode
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
  
  // Map center and navigation
  mapCenter: [number, number];
  setMapCenter: (center: [number, number]) => void;
  navigateToPolygon: (polygonId: string) => void;
  
  // Time-based polygon visibility
  getVisiblePolygons: () => Polygon[];
  
  // Reset function for testing
  resetStore: () => void;
}

const defaultDataSource: DataSource = {
  id: 'open-meteo-temp',
  name: 'Temperature (°C)',
  field: 'temperature_2m',
  colorRules: [
    { id: '1', operator: '<', value: 10, color: '#3b82f6' }, // Blue
    { id: '2', operator: '>=', value: 10, color: '#10b981' }, // Green
    { id: '3', operator: '>=', value: 25, color: '#f59e0b' }, // Yellow
    { id: '4', operator: '>=', value: 35, color: '#ef4444' }, // Red
  ]
};

// Use yesterday's data by default since API only has historical data
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const defaultTimeRange: TimeRange = {
  start: yesterday,
  end: yesterday,
  mode: 'single'
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      timeRange: defaultTimeRange,
      setTimeRange: (range) => set({ timeRange: range }),
      
      polygons: [],
      addPolygon: (polygon) => set((state) => ({ 
        polygons: [...state.polygons, polygon] 
      })),
      removePolygon: (id) => set((state) => ({ 
        polygons: state.polygons.filter(p => p.id !== id) 
      })),
      updatePolygon: (id, updates) => set((state) => ({
        polygons: state.polygons.map(p => 
          p.id === id ? { ...p, ...updates } : p
        )
      })),
      clearAllPolygons: () => set({ polygons: [] }),
      
      dataSources: [defaultDataSource],
      addDataSource: (dataSource) => set((state) => ({ 
        dataSources: [...state.dataSources, dataSource] 
      })),
      updateDataSource: (id, updates) => set((state) => ({
        dataSources: state.dataSources.map(ds => 
          ds.id === id ? { ...ds, ...updates } : ds
        )
      })),
      deleteDataSource: (id) => set((state) => {
        // Also remove any polygons using this data source
        const updatedPolygons = state.polygons.filter(p => p.dataSourceId !== id);
        return {
          dataSources: state.dataSources.filter(ds => ds.id !== id),
          polygons: updatedPolygons
        };
      }),
      
      isDrawing: false,
      setIsDrawing: (drawing) => set({ isDrawing: drawing }),
      
      mapCenter: [52.5200, 13.4050], // Berlin
      setMapCenter: (center) => set({ mapCenter: center }),
      
      navigateToPolygon: (polygonId) => {
        const state = get();
        const polygon = state.polygons.find(p => p.id === polygonId);
        if (polygon && polygon.coordinates.length > 0) {
          // Calculate the centroid of the polygon
          const lat = polygon.coordinates.reduce((sum, coord) => sum + coord[0], 0) / polygon.coordinates.length;
          const lng = polygon.coordinates.reduce((sum, coord) => sum + coord[1], 0) / polygon.coordinates.length;
          set({ mapCenter: [lat, lng] });
          
          // Also trigger zoom to polygon via localStorage
          localStorage.setItem('navigate-to-polygon', polygonId);
          // Trigger a custom event for immediate response
          window.dispatchEvent(new CustomEvent('navigate-to-polygon', { detail: polygonId }));
        }
      },
      
      getVisiblePolygons: () => {
        const state = get();
        const currentTime = state.timeRange.mode === 'range' ? state.timeRange.end : state.timeRange.start;
        
        return state.polygons.filter(polygon => {
          // Show polygon if it was created at or before the current selected time
          return polygon.createdAt <= currentTime;
        });
      },
      
      resetStore: () => set({
        polygons: [],
        mapCenter: [52.5200, 13.4050],
        timeRange: defaultTimeRange,
        isDrawing: false,
        dataSources: [defaultDataSource]
      }),
    }),
    {
      name: 'weather-dashboard-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        polygons: state.polygons,
        dataSources: state.dataSources,
        mapCenter: state.mapCenter,
      }),
    }
  )
);
