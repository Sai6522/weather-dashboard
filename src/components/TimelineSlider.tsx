'use client';

import React, { useState, useEffect } from 'react';
import { Range } from 'react-range';
import { Button, Switch, Typography } from 'antd';
import { format, addHours, subDays, addDays } from 'date-fns';
import { useStore } from '@/store/useStore';

const { Text } = Typography;

export const TimelineSlider: React.FC = () => {
  const { timeRange, setTimeRange } = useStore();
  
  // Create 30-day window ending yesterday (since API only has historical data)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startDate = subDays(yesterday, 29); // 30 days of historical data
  const endDate = yesterday;
  
  // Convert to hours for slider
  const totalHours = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
  const currentHourIndex = Math.floor((yesterday.getTime() - startDate.getTime()) / (1000 * 60 * 60));
  
  // Initialize slider mode from store or default to 'single'
  const [sliderMode, setSliderMode] = useState<'single' | 'range'>(() => {
    return timeRange?.mode || 'single';
  });
  
  // Track which thumb is being dragged
  const [draggedThumb, setDraggedThumb] = useState<number | null>(null);
  
  // Initialize state based on current timeRange
  const [values, setValues] = useState(() => {
    const startHour = Math.floor((timeRange.start.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    return [Math.max(0, Math.min(totalHours, startHour))];
  });
  
  const [rangeValues, setRangeValues] = useState(() => {
    const startHour = Math.floor((timeRange.start.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    const endHour = Math.floor((timeRange.end.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    return [
      Math.max(0, Math.min(totalHours, startHour)),
      Math.max(0, Math.min(totalHours, endHour))
    ];
  });

  const hourToDate = (hourIndex: number): Date => {
    return addHours(startDate, Math.max(0, Math.min(totalHours, hourIndex)));
  };

  const updateTimeRange = (newValues: number[], mode?: 'single' | 'range') => {
    const currentMode = mode || sliderMode;
    
    if (currentMode === 'single') {
      const selectedDate = hourToDate(newValues[0]);
      setTimeRange({
        start: selectedDate,
        end: selectedDate,
        mode: 'single'
      });
    } else {
      // Ensure values are in correct order
      const sortedValues = [...newValues].sort((a, b) => a - b);
      setTimeRange({
        start: hourToDate(sortedValues[0]),
        end: hourToDate(sortedValues[1]),
        mode: 'range'
      });
    }
  };

  const handleModeChange = (checked: boolean) => {
    console.log('Switch clicked:', checked, 'Current mode:', sliderMode);
    const newMode = checked ? 'range' : 'single';
    console.log('Setting new mode:', newMode);
    setSliderMode(newMode);
    
    if (newMode === 'single') {
      const singleValue = [Math.floor((rangeValues[0] + rangeValues[1]) / 2)];
      setValues(singleValue);
      updateTimeRange(singleValue, 'single');
    } else {
      // Don't sort range values - keep thumb positions
      setRangeValues(rangeValues);
      // But sort for store update
      const sortedForStore = [...rangeValues].sort((a, b) => a - b);
      updateTimeRange(sortedForStore, 'range');
    }
  };

  const resetToNow = () => {
    if (sliderMode === 'single') {
      const newValues = [currentHourIndex];
      setValues(newValues);
      updateTimeRange(newValues, 'single');
    } else {
      // Create a proper range around current time
      const startHour = Math.max(0, currentHourIndex - 12);
      const endHour = Math.min(totalHours, currentHourIndex + 12);
      const newRange = [startHour, endHour];
      setRangeValues(newRange);
      updateTimeRange(newRange, 'range');
    }
  };

  const formatDateTime = (date: Date) => {
    return format(date, 'MMM dd, HH:mm');
  };

  const getTickMarks = () => {
    const ticks = [];
    for (let i = 0; i <= totalHours; i += 24) { // Every day
      ticks.push({
        value: i,
        label: format(hourToDate(i), 'MMM dd')
      });
    }
    return ticks;
  };

  // Sync with store changes
  useEffect(() => {
    setSliderMode(timeRange.mode);
    
    if (timeRange.mode === 'single') {
      const startHour = Math.floor((timeRange.start.getTime() - startDate.getTime()) / (1000 * 60 * 60));
      setValues([Math.max(0, Math.min(totalHours, startHour))]);
    } else {
      const startHour = Math.floor((timeRange.start.getTime() - startDate.getTime()) / (1000 * 60 * 60));
      const endHour = Math.floor((timeRange.end.getTime() - startDate.getTime()) / (1000 * 60 * 60));
      setRangeValues([
        Math.max(0, Math.min(totalHours, startHour)),
        Math.max(0, Math.min(totalHours, endHour))
      ]);
    }
  }, [timeRange, startDate, totalHours]);

  // Handle global mouse events for drag state
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDraggedThumb(null);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mouseleave', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleGlobalMouseUp);
    };
  }, []);

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <div>
          <Text strong className="text-lg">Timeline Control</Text>
          <div className="flex items-center gap-4 mt-2">
            <Text className="text-sm">Single Hour</Text>
            <Switch 
              key={`switch-${sliderMode}`}
              checked={sliderMode === 'range'} 
              onChange={handleModeChange}
              size="small"
              className="mx-2"
              style={{ backgroundColor: sliderMode === 'range' ? '#1890ff' : undefined }}
            />
            <Text className="text-sm">Time Range</Text>
            <Text className="text-xs text-gray-500 ml-2">
              (Current: {sliderMode})
            </Text>
          </div>
        </div>
        <Button onClick={resetToNow} type="primary" size="middle">
          Reset to Now
        </Button>
      </div>

      <div className="mb-6">
        {sliderMode === 'single' ? (
          <div>
            <Text className="block mb-2">
              Selected Time: {formatDateTime(timeRange.start)}
            </Text>
            <div className="px-4">
              <Range
                step={1}
                min={0}
                max={totalHours}
                values={values}
                onChange={(newValues) => {
                  setValues(newValues);
                  updateTimeRange(newValues);
                }}
                renderTrack={({ props, children }) => (
                  <div
                    {...props}
                    className="w-full h-3 bg-gray-200 rounded-full relative"
                    style={{ ...props.style }}
                  >
                    {children}
                  </div>
                )}
                renderThumb={({ props }) => (
                  <div
                    {...props}
                    className="w-7 h-7 bg-blue-500 rounded-full shadow-lg cursor-pointer hover:bg-blue-600 transition-colors border-2 border-white"
                    style={{ ...props.style }}
                  />
                )}
              />
            </div>
          </div>
        ) : (
          <div>
            <Text className="block mb-2">
              Time Range: {formatDateTime(timeRange.start)} - {formatDateTime(timeRange.end)}
            </Text>
            <div className="px-4">
              <Range
                key={`range-${rangeValues[0]}-${rangeValues[1]}`}
                step={1}
                min={0}
                max={totalHours}
                values={rangeValues}
                onChange={(newValues) => {
                  // Ensure we have exactly 2 values and maintain their exact positions
                  if (newValues.length === 2) {
                    console.log('Range values changed:', newValues, 'Previous:', rangeValues);
                    
                    // Keep the exact values without any modification
                    const [leftThumb, rightThumb] = newValues;
                    const newRangeValues = [leftThumb, rightThumb];
                    
                    // Only update if values actually changed
                    if (leftThumb !== rangeValues[0] || rightThumb !== rangeValues[1]) {
                      setRangeValues(newRangeValues);
                      
                      // For store update, determine which is start and which is end
                      const startTime = Math.min(leftThumb, rightThumb);
                      const endTime = Math.max(leftThumb, rightThumb);
                      updateTimeRange([startTime, endTime]);
                    }
                  }
                }}
                renderTrack={({ props, children }) => (
                  <div
                    {...props}
                    className="w-full h-3 bg-gray-200 rounded-full relative"
                    style={{ ...props.style }}
                  >
                    <div
                      className="h-3 bg-blue-400 rounded-full absolute"
                      style={{
                        left: `${(Math.min(...rangeValues) / totalHours) * 100}%`,
                        width: `${(Math.abs(rangeValues[1] - rangeValues[0]) / totalHours) * 100}%`
                      }}
                    />
                    {children}
                  </div>
                )}
                renderThumb={({ props, index }) => {
                  const thumbValue = rangeValues[index ?? 0];
                  const thumbTime = formatDateTime(hourToDate(thumbValue));
                  const isBeingDragged = draggedThumb === index;
                  
                  return (
                    <div
                      {...props}
                      className={`w-8 h-8 rounded-full shadow-lg cursor-pointer transition-all duration-200 border-3 border-white ${
                        index === 0 
                          ? `bg-blue-500 hover:bg-blue-600 ${isBeingDragged ? 'scale-125 shadow-xl' : 'hover:scale-110'}` 
                          : `bg-green-500 hover:bg-green-600 ${isBeingDragged ? 'scale-125 shadow-xl' : 'hover:scale-110'}`
                      }`}
                      style={{ 
                        ...props.style,
                        zIndex: isBeingDragged ? 20 : 10 + (index ?? 0) // Higher z-index when dragging
                      }}
                      title={`${index === 0 ? 'Left' : 'Right'} Thumb: ${thumbTime}`}
                      onMouseDown={() => setDraggedThumb(index ?? 0)}
                      onMouseUp={() => setDraggedThumb(null)}
                    >
                      {/* Add a small indicator inside the thumb */}
                      <div className={`w-2 h-2 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
                        index === 0 ? 'bg-blue-200' : 'bg-green-200'
                      }`} />
                      
                      {/* Show position number when dragging */}
                      {isBeingDragged && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {thumbTime}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
            </div>
            
            {/* Range indicators */}
            <div className="flex justify-between mt-2 px-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                Left: {formatDateTime(hourToDate(rangeValues[0]))}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Right: {formatDateTime(hourToDate(rangeValues[1]))}
              </span>
            </div>
            <div className="text-center mt-1 px-4 text-xs text-gray-500">
              Range: {formatDateTime(hourToDate(Math.min(...rangeValues)))} - {formatDateTime(hourToDate(Math.max(...rangeValues)))}
            </div>
          </div>
        )}
      </div>

      {/* Time markers */}
      <div className="relative px-4">
        <div className="flex justify-between text-xs text-gray-500">
          {getTickMarks().map((tick, index) => (
            <span key={index} className="text-center">
              {tick.label}
            </span>
          ))}
        </div>
      </div>
      
      {/* Mode indicator */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        {sliderMode === 'range' ? (
          <span>💡 Both thumbs are movable - drag either end to adjust the time range</span>
        ) : (
          <span>💡 Single time point selected - switch to range mode for time periods</span>
        )}
      </div>
    </div>
  );
};
