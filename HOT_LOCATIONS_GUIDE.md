# 🔴 Hot Weather Locations for Red Polygons (≥ 35°C)

## 🌡️ **Best Locations for Red Polygons**

### **1. Middle East & North Africa**
- **Dubai, UAE**: 25.2°N, 55.3°E
- **Riyadh, Saudi Arabia**: 24.7°N, 46.7°E  
- **Kuwait City**: 29.4°N, 47.9°E
- **Phoenix, Arizona**: 33.4°N, 112.1°W
- **Las Vegas, Nevada**: 36.2°N, 115.1°W

### **2. Desert Regions**
- **Death Valley, California**: 36.5°N, 116.9°W
- **Sahara Desert (Algeria)**: 23.0°N, 5.0°E
- **Atacama Desert (Chile)**: -24.5°S, -69.2°W
- **Australian Outback**: -25.0°S, 131.0°E

### **3. Summer Hot Spots**
- **Delhi, India**: 28.6°N, 77.2°E
- **Baghdad, Iraq**: 33.3°N, 44.4°E
- **Tehran, Iran**: 35.7°N, 51.4°E
- **Karachi, Pakistan**: 24.9°N, 67.0°E

## 📅 **Best Time Periods**

Since the API uses historical data, look for:
- **Summer months**: June, July, August
- **Recent hot days**: Check weather history for heat waves
- **Desert regions**: Generally hotter year-round

## 🎯 **How to Find Hot Spots**

### **Method 1: Use the Test Page**
1. Go to `http://localhost:3000/polygon-test`
2. Click "Test Multiple Locations"
3. Look for temperatures ≥ 35°C in the results

### **Method 2: Manual Search**
1. Navigate the map to hot climate regions
2. Create test polygons in different areas
3. Check the sidebar for temperature readings
4. Look for red-colored polygons

## 🗺️ **Map Navigation Tips**

### **Zoom to Hot Regions:**
```javascript
// In browser console, you can navigate to hot locations:
// Dubai
map.setView([25.2048, 55.2708], 10);

// Phoenix, Arizona  
map.setView([33.4484, -112.0740], 10);

// Death Valley
map.setView([36.5323, -116.9325], 10);
```

## 🔍 **Testing Strategy**

### **Step-by-Step Process:**
1. **Start the app**: `npm run dev`
2. **Navigate to hot region**: Use map controls to zoom to Middle East/Desert areas
3. **Draw polygon**: Click "Draw Polygon" button
4. **Create polygon**: Click 3+ points in the hot region
5. **Complete**: Double-click to finish
6. **Configure**: Set name and data source
7. **Check result**: Look for red color and temperature ≥ 35°C

## 🌡️ **Temperature Thresholds**

- **< 10°C**: 🔵 Blue
- **10-24°C**: 🟢 Green  
- **25-34°C**: 🟡 Yellow
- **≥ 35°C**: 🔴 **RED** ← This is what you want!

## 🎯 **Quick Test Coordinates**

Copy these coordinates to test:

### **Dubai (Usually Hot)**
- Latitude: 25.2048
- Longitude: 55.2708

### **Phoenix, Arizona**
- Latitude: 33.4484
- Longitude: -112.0740

### **Riyadh, Saudi Arabia**
- Latitude: 24.7136
- Longitude: 46.6753

## 🧪 **Verification Script**

You can also test specific hot locations:
