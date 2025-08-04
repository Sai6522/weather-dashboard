# How to Clear All Polygons

## Method 1: Using the UI Button
1. Open the weather dashboard
2. Look for the "Clear All Polygons" button in the right sidebar
3. Click the button and confirm the deletion

## Method 2: Using Browser Console
1. Open the weather dashboard in your browser
2. Press F12 to open Developer Tools
3. Go to the Console tab
4. Paste and run this command:

```javascript
// Clear all polygons from localStorage
const storageKey = 'weather-dashboard-storage';
let storageData = {};

try {
  const existingData = localStorage.getItem(storageKey);
  if (existingData) {
    storageData = JSON.parse(existingData);
  }
} catch (error) {
  console.log('No existing storage data found');
}

// Clear polygons
storageData.state = storageData.state || {};
storageData.state.polygons = [];

// Save back to localStorage
localStorage.setItem(storageKey, JSON.stringify(storageData));

console.log('All polygons cleared! Please refresh the page.');
```

5. Refresh the page to see the changes

## Method 3: Reset Everything
If you want to reset the entire application (polygons + data sources + settings):
1. Use the "Reset" button in the top header
2. Or run this in the console:

```javascript
localStorage.removeItem('weather-dashboard-storage');
location.reload();
```

## Verification
After clearing polygons, you should see:
- No polygons on the map
- "0/0 polygons visible" in the sidebar
- No items in the "Active Polygons" section
