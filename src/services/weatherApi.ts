import axios from 'axios';
import { format, subDays, addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

export interface WeatherData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: {
    time: string;
    temperature_2m: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
  };
}

interface CacheEntry {
  data: WeatherData;
  timestamp: number;
  expiresAt: number;
}

class WeatherApiService {
  private baseUrl = 'https://archive-api.open-meteo.com/v1/archive';
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<WeatherData | null>>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  
  // Create axios instance with optimizations
  private axiosInstance = axios.create({
    timeout: this.REQUEST_TIMEOUT,
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  });

  constructor() {
    // Set up request interceptor for better error handling
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log('🌐 API Request:', config.url, config.params);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Set up response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log('✅ API Response received:', response.status);
        return response;
      },
      (error) => {
        console.error('❌ API Error:', error.message);
        return Promise.reject(error);
      }
    );

    // Clean up cache periodically
    setInterval(() => this.cleanupCache(), 5 * 60 * 1000); // Every 5 minutes
  }

  // Get the maximum available date (API only has historical data)
  private getMaxAvailableDate(): Date {
    const today = new Date();
    // Open-Meteo archive API typically has data up to yesterday
    return subDays(today, 1);
  }

  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    // Convert entries to array to avoid iteration issues
    const entries = Array.from(this.cache.entries());
    
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    // If cache is still too large, remove oldest entries
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const allEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = allEntries.slice(0, allEntries.length - this.MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }

    console.log(`🧹 Cache cleanup: ${keysToDelete.length} expired entries removed, ${this.cache.size} entries remaining`);
  }

  private getCacheKey(latitude: number, longitude: number, startDate: Date, endDate: Date): string {
    return `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}`;
  }

  private isValidCacheEntry(entry: CacheEntry): boolean {
    return Date.now() < entry.expiresAt;
  }

  async fetchWeatherData(
    latitude: number,
    longitude: number,
    startDate: Date,
    endDate: Date
  ): Promise<WeatherData | null> {
    // Ensure dates are within available range
    const maxDate = this.getMaxAvailableDate();
    const adjustedStartDate = isAfter(startDate, maxDate) ? maxDate : startDate;
    const adjustedEndDate = isAfter(endDate, maxDate) ? maxDate : endDate;

    const cacheKey = this.getCacheKey(latitude, longitude, adjustedStartDate, adjustedEndDate);
    
    // Check cache first
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry && this.isValidCacheEntry(cachedEntry)) {
      console.log('💾 Cache hit for:', cacheKey);
      return cachedEntry.data;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      console.log('⏳ Request already pending for:', cacheKey);
      return this.pendingRequests.get(cacheKey)!;
    }

    // Create new request
    const requestPromise = this.makeWeatherRequest(latitude, longitude, adjustedStartDate, adjustedEndDate, cacheKey);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async makeWeatherRequest(
    latitude: number,
    longitude: number,
    startDate: Date,
    endDate: Date,
    cacheKey: string
  ): Promise<WeatherData | null> {
    try {
      const params = {
        latitude: latitude.toFixed(4),
        longitude: longitude.toFixed(4),
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        hourly: 'temperature_2m,relative_humidity_2m,precipitation,windspeed_10m,pressure_msl',
        timezone: 'UTC'
      };

      const response = await this.axiosInstance.get(this.baseUrl, { params });
      const data = response.data as WeatherData;
      
      // Cache the result
      const now = Date.now();
      this.cache.set(cacheKey, {
        data,
        timestamp: now,
        expiresAt: now + this.CACHE_DURATION
      });

      console.log('✅ Weather data cached for:', cacheKey);
      return data;
    } catch (error) {
      console.error('❌ Error fetching weather data:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.error('⏰ Request timeout');
        } else if (error.response) {
          console.error('🚫 API Error:', error.response.status, error.response.data);
        } else if (error.request) {
          console.error('📡 Network Error: No response received');
        }
      }
      return null;
    }
  }

  async getTemperatureForTimeRange(
    latitude: number,
    longitude: number,
    startTime: Date,
    endTime: Date
  ): Promise<number | null> {
    // For current/future dates, use the most recent available data
    const maxDate = this.getMaxAvailableDate();
    let adjustedStartTime = startTime;
    let adjustedEndTime = endTime;

    if (isAfter(startTime, maxDate)) {
      adjustedStartTime = startOfDay(maxDate);
      adjustedEndTime = endOfDay(maxDate);
    } else if (isAfter(endTime, maxDate)) {
      adjustedEndTime = endOfDay(maxDate);
    }

    // Extend the date range to ensure we have data
    const startDate = subDays(startOfDay(adjustedStartTime), 1);
    const endDate = addDays(endOfDay(adjustedEndTime), 1);

    const data = await this.fetchWeatherData(latitude, longitude, startDate, endDate);
    
    if (!data || !data.hourly) {
      return null;
    }

    const { time, temperature_2m } = data.hourly;
    
    // Filter data for the requested time range
    const relevantTemperatures: number[] = [];
    
    time.forEach((timeStr, index) => {
      const dataTime = new Date(timeStr);
      const temp = temperature_2m[index];
      
      const dataDay = format(dataTime, 'yyyy-MM-dd');
      const startDay = format(adjustedStartTime, 'yyyy-MM-dd');
      const endDay = format(adjustedEndTime, 'yyyy-MM-dd');
      
      if (dataDay >= startDay && dataDay <= endDay && temp !== null && temp !== undefined) {
        relevantTemperatures.push(temp);
      }
    });

    if (relevantTemperatures.length === 0) {
      // Fallback: try to get any temperature from the available data
      const validTemperatures = temperature_2m.filter(temp => temp !== null && temp !== undefined);
      if (validTemperatures.length > 0) {
        return validTemperatures[Math.floor(validTemperatures.length / 2)];
      }
      return null;
    }

    // Return average temperature for the time range
    return relevantTemperatures.reduce((sum, temp) => sum + temp, 0) / relevantTemperatures.length;
  }

  // Batch request multiple locations at once
  async batchGetTemperatures(
    locations: Array<{ id: string; latitude: number; longitude: number }>,
    startTime: Date,
    endTime: Date
  ): Promise<Map<string, number | null>> {
    const results = new Map<string, number | null>();
    
    // Process in batches to avoid overwhelming the API
    const BATCH_SIZE = 5;
    const batches = [];
    
    for (let i = 0; i < locations.length; i += BATCH_SIZE) {
      batches.push(locations.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      const promises = batch.map(async (location) => {
        const temp = await this.getTemperatureForTimeRange(
          location.latitude,
          location.longitude,
          startTime,
          endTime
        );
        return { id: location.id, temperature: temp };
      });

      const batchResults = await Promise.allSettled(promises);
      
      batchResults.forEach((result, index) => {
        const location = batch[index];
        if (result.status === 'fulfilled') {
          results.set(location.id, result.value.temperature);
        } else {
          console.error(`Failed to get temperature for ${location.id}:`, result.reason);
          results.set(location.id, null);
        }
      });

      // Small delay between batches to be respectful to the API
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  async getSimpleTemperature(latitude: number, longitude: number): Promise<number | null> {
    const maxDate = this.getMaxAvailableDate();
    const startDate = subDays(maxDate, 2);
    const endDate = maxDate;

    const data = await this.fetchWeatherData(latitude, longitude, startDate, endDate);
    
    if (!data || !data.hourly || !data.hourly.temperature_2m) {
      return null;
    }

    const temperatures = data.hourly.temperature_2m.filter(temp => temp !== null && temp !== undefined);
    if (temperatures.length === 0) {
      return null;
    }

    return temperatures[temperatures.length - 1];
  }

  // Get cache statistics
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    // Convert values to array to avoid iteration issues
    const entries = Array.from(this.cache.values());
    
    for (const entry of entries) {
      if (now < entry.expiresAt) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      pendingRequests: this.pendingRequests.size,
      cacheHitRate: this.cache.size > 0 ? (validEntries / this.cache.size * 100).toFixed(1) + '%' : '0%'
    };
  }

  clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
    console.log('🗑️ Cache cleared');
  }
}

export const weatherApi = new WeatherApiService();
