// Script to clear all polygons from localStorage
console.log('Clearing all polygons from localStorage...');

// Get the current storage data
const storageKey = 'weather-dashboard-storage';
let storageData = {};

try {
  const existingData = localStorage.getItem(storageKey);
  if (existingData) {
    storageData = JSON.parse(existingData);
  }
} catch (error) {
  console.log('No existing storage data found or invalid JSON');
}

// Clear polygons
storageData.state = storageData.state || {};
storageData.state.polygons = [];

// Save back to localStorage
localStorage.setItem(storageKey, JSON.stringify(storageData));

console.log('All polygons cleared successfully!');
console.log('Please refresh the page to see the changes.');
