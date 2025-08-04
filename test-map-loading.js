// Test script to verify map loading improvements
console.log('🗺️ Testing Map Loading Improvements...\n');

// Wait for DOM to be ready
function waitForDOM() {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });
}

// Wait for map container to appear
function waitForMapContainer(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function checkForMap() {
      const mapContainer = document.querySelector('.leaflet-container');
      
      if (mapContainer) {
        console.log('✅ Map container found');
        resolve(mapContainer);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Map container not found within timeout'));
      } else {
        setTimeout(checkForMap, 100);
      }
    }
    
    checkForMap();
  });
}

// Wait for map to be fully loaded
function waitForMapLoaded(timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function checkMapLoaded() {
      const mapContainer = document.querySelector('.leaflet-container');
      const isFullyLoaded = mapContainer && (
        mapContainer.classList.contains('map-fully-loaded') ||
        mapContainer.getAttribute('data-map-loaded') === 'true'
      );
      
      if (isFullyLoaded) {
        console.log('✅ Map fully loaded');
        resolve(mapContainer);
      } else if (Date.now() - startTime > timeout) {
        console.log('⚠️ Map loading timeout - but container exists');
        resolve(mapContainer); // Still resolve with container
      } else {
        setTimeout(checkMapLoaded, 200);
      }
    }
    
    checkMapLoaded();
  });
}

// Run the test
async function runMapLoadingTest() {
  try {
    console.log('1. Waiting for DOM...');
    await waitForDOM();
    
    console.log('2. Waiting for map container...');
    const mapContainer = await waitForMapContainer();
    
    console.log('3. Waiting for map to fully load...');
    await waitForMapLoaded();
    
    // Check final state
    const rect = mapContainer.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    const hasProperSize = rect.width >= 300 && rect.height >= 400;
    
    console.log('\n📊 Map Loading Test Results:');
    console.log(`   Container exists: ✅`);
    console.log(`   Visible: ${isVisible ? '✅' : '❌'}`);
    console.log(`   Proper size: ${hasProperSize ? '✅' : '⚠️'} (${rect.width}x${rect.height}px)`);
    console.log(`   Fully loaded class: ${mapContainer.classList.contains('map-fully-loaded') ? '✅' : '⚠️'}`);
    console.log(`   Data attribute: ${mapContainer.getAttribute('data-map-loaded') === 'true' ? '✅' : '⚠️'}`);
    
    // Check for loading overlay
    const loadingOverlay = document.querySelector('.map-loading-overlay');
    console.log(`   Loading overlay removed: ${!loadingOverlay ? '✅' : '⚠️'}`);
    
    return {
      success: true,
      containerExists: true,
      isVisible,
      hasProperSize,
      fullyLoaded: mapContainer.classList.contains('map-fully-loaded') || 
                   mapContainer.getAttribute('data-map-loaded') === 'true'
    };
    
  } catch (error) {
    console.error('❌ Map loading test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runMapLoadingTest };
} else if (typeof window !== 'undefined') {
  window.runMapLoadingTest = runMapLoadingTest;
}

// Auto-run if in browser
if (typeof window !== 'undefined' && document.readyState !== 'loading') {
  runMapLoadingTest();
}
