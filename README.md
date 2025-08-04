# Weather Data Dashboard

A comprehensive React/Next.js application with TypeScript that visualizes dynamic weather data over an interactive map with timeline controls and polygon-based data analysis.

![Dashboard Preview](https://via.placeholder.com/800x400/3b82f6/ffffff?text=Weather+Dashboard+Preview)

## 🚀 Features

### Core Functionality
- **Interactive Timeline Slider**: Navigate through 30 days of hourly weather data (15 days before/after today)
- **Dual Timeline Modes**: Single hour selection or time range selection
- **Interactive Map**: Leaflet-based map with drawing capabilities
- **Polygon Drawing**: Create polygons with 3-12 points to define analysis regions
- **Real-time Data Visualization**: Color-coded polygons based on weather data
- **Dynamic Color Rules**: Customizable threshold-based coloring system
- **Data Source Management**: Configure multiple data sources with custom rules

### Advanced Features
- **Persistent State**: Polygons and settings saved across browser sessions
- **API Integration**: Real-time data from Open-Meteo weather API
- **Responsive Design**: Works on desktop and mobile devices
- **TypeScript**: Full type safety throughout the application
- **Modern UI**: Ant Design components with custom styling

## 🛠 Tech Stack

### Required Technologies
- **React 18** with Next.js 14
- **TypeScript** for type safety
- **Zustand** for state management
- **Leaflet** with React-Leaflet for mapping
- **Ant Design** for UI components

### Additional Libraries
- **react-range** for timeline slider
- **date-fns** for date manipulation
- **axios** for API requests
- **Tailwind CSS** for styling

## 📋 Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- Modern web browser with JavaScript enabled

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd weather-dashboard
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
No API keys are required for the basic functionality as we use the free Open-Meteo API. However, if you want to add additional weather APIs, create a `.env.local` file:

```bash
# Optional: Add API keys for additional weather services
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key
NEXT_PUBLIC_WEATHERAPI_KEY=your_weatherapi_key
```

### 4. Run the Development Server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
# or
yarn build
yarn start
```

## 🎯 Usage Guide

### Step 1: Timeline Navigation
1. Use the timeline slider at the top to select your desired time period
2. Toggle between "Single Hour" and "Time Range" modes
3. Click "Reset to Now" to return to the current time

### Step 2: Drawing Polygons
1. Click "Draw Polygon" to enter drawing mode
2. Click on the map to add points (minimum 3, maximum 12)
3. Double-click to complete the polygon
4. Configure the polygon name and data source in the modal

### Step 3: Data Source Configuration
1. Use the sidebar to manage data sources
2. Add custom color rules with operators (=, <, >, <=, >=)
3. Set threshold values and corresponding colors
4. View active polygons and their current values

### Step 4: Data Analysis
1. Polygons automatically update colors based on weather data
2. Click on polygons to view detailed information
3. Delete polygons using the popup menu
4. Move the map to explore different regions

## 🌐 API Integration

### Open-Meteo API (Primary)
The application uses the Open-Meteo Historical Weather API:
- **Endpoint**: `https://archive-api.open-meteo.com/v1/archive`
- **No API Key Required**: Free for non-commercial use
- **Data Available**: Historical weather data from 1940 onwards
- **Update Frequency**: Daily updates
- **Rate Limits**: Generous limits for personal use

### Available Weather Parameters
- `temperature_2m`: Temperature at 2 meters (°C)
- `relative_humidity_2m`: Relative humidity (%)
- `precipitation`: Total precipitation (mm)
- `windspeed_10m`: Wind speed at 10 meters (km/h)
- `pressure_msl`: Atmospheric pressure (hPa)
- `cloudcover`: Total cloud cover (%)

### API Usage Example
```javascript
const response = await fetch(
  'https://archive-api.open-meteo.com/v1/archive?' +
  'latitude=52.52&longitude=13.41&' +
  'start_date=2025-07-18&end_date=2025-08-01&' +
  'hourly=temperature_2m&timezone=UTC'
);
```

### Adding Additional APIs
To add more weather data sources:

1. **OpenWeatherMap** (requires API key):
   ```bash
   # Sign up at https://openweathermap.org/api
   # Add to .env.local:
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key
   ```

2. **WeatherAPI** (requires API key):
   ```bash
   # Sign up at https://www.weatherapi.com/
   # Add to .env.local:
   NEXT_PUBLIC_WEATHERAPI_KEY=your_api_key
   ```

## 📁 Project Structure

```
weather-dashboard/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main page
│   ├── components/            # React components
│   │   ├── Dashboard.tsx      # Main dashboard layout
│   │   ├── TimelineSlider.tsx # Timeline control component
│   │   ├── InteractiveMap.tsx # Map with polygon drawing
│   │   └── DataSourceSidebar.tsx # Data source configuration
│   ├── services/              # API services
│   │   └── weatherApi.ts      # Weather API integration
│   └── store/                 # State management
│       └── useStore.ts        # Zustand store
├── public/
│   └── archive.json           # API endpoints reference
├── package.json               # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── README.md                 # This file
```

## 🎨 Customization

### Adding New Data Sources
1. Open the sidebar and click "Add Data Source"
2. Enter the data source name and API field name
3. Configure color rules with thresholds and colors
4. The new data source will be available for polygon assignment

### Modifying Color Rules
1. Select a data source in the sidebar
2. Add, edit, or delete color rules
3. Use operators: `=`, `<`, `>`, `<=`, `>=`
4. Choose colors using the color picker
5. Rules are applied in order of threshold values

### Customizing the Map
- **Change Default Location**: Modify `mapCenter` in `useStore.ts`
- **Add Different Tile Layers**: Update the `TileLayer` component in `InteractiveMap.tsx`
- **Adjust Zoom Levels**: Modify zoom settings in the `MapContainer`

## 🔍 Troubleshooting

### Common Issues

1. **Map Not Loading**
   - Ensure you have a stable internet connection
   - Check browser console for JavaScript errors
   - Try refreshing the page

2. **Weather Data Not Updating**
   - Check the Open-Meteo API status
   - Verify your internet connection
   - Clear browser cache and reload

3. **Polygons Not Drawing**
   - Make sure you clicked "Draw Polygon" first
   - Ensure you have at least 3 points before double-clicking
   - Check browser console for errors

4. **Timeline Slider Issues**
   - Refresh the page to reset the timeline
   - Check if the date range is valid
   - Ensure JavaScript is enabled

### Performance Optimization
- The application caches API responses to reduce network requests
- Polygon colors update automatically when timeline changes
- State is persisted in localStorage for faster loading

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically with zero configuration

### Netlify
1. Build the project: `npm run build`
2. Deploy the `out` folder to Netlify
3. Configure redirects for client-side routing

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Open-Meteo** for providing free weather data API
- **Leaflet** for the excellent mapping library
- **Ant Design** for the beautiful UI components
- **React-Leaflet** for React integration
- **Zustand** for simple state management

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information
4. Include browser version, error messages, and steps to reproduce

---

**Happy Weather Mapping! 🌤️**
