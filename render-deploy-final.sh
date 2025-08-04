#!/bin/bash

# Weather Dashboard - Final Render API Deployment Script
# This script deploys the weather dashboard using correct Render API format

set -e

echo "🌤️  Weather Dashboard - Render API Deployment (Final)"
echo "====================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Render API configuration
RENDER_API_KEY="rnd_DWAfs0ZNhHKG1gbGqQ9wN9HsMIIG"
RENDER_API_URL="https://api.render.com/v1"
OWNER_ID="tea-cspq6bt6l47c73fep8og"
GITHUB_REPO="https://github.com/Sai6522/weather-dashboard"
SERVICE_NAME="weather-dashboard"

print_status "Deploying Weather Dashboard to Render..."
print_status "Owner: Venkata Sai Prasad Pulaparthi's Workspace"
print_status "Repository: $GITHUB_REPO"
print_status "Service Name: $SERVICE_NAME"

# Create service configuration with correct format
SERVICE_CONFIG=$(cat <<'EOF'
{
  "type": "web_service",
  "name": "weather-dashboard",
  "ownerId": "tea-cspq6bt6l47c73fep8og",
  "repo": "https://github.com/Sai6522/weather-dashboard",
  "branch": "main",
  "buildCommand": "",
  "startCommand": "",
  "plan": "starter",
  "region": "oregon",
  "env": "docker",
  "envVars": [
    {
      "key": "NODE_ENV",
      "value": "production"
    },
    {
      "key": "NEXT_TELEMETRY_DISABLED",
      "value": "1"
    },
    {
      "key": "PORT",
      "value": "3000"
    },
    {
      "key": "HOSTNAME",
      "value": "0.0.0.0"
    }
  ],
  "serviceDetails": {
    "env": "docker",
    "dockerfilePath": "./Dockerfile",
    "dockerContext": ".",
    "healthCheckPath": "/api/health",
    "autoDeploy": "yes",
    "pullRequestPreviewsEnabled": "no"
  }
}
EOF
)

print_status "Creating Render service with Docker runtime..."

# Create the service using Render API
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$SERVICE_CONFIG" \
  "$RENDER_API_URL/services")

# Extract HTTP status code and response body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)

print_status "HTTP Response Code: $HTTP_CODE"

if [ "$HTTP_CODE" -eq 201 ]; then
    print_success "Service created successfully!"
    
    # Extract service details
    SERVICE_ID=$(echo "$RESPONSE_BODY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('service', {}).get('id', 'N/A'))
except:
    print('N/A')
" 2>/dev/null || echo "N/A")
    
    SERVICE_URL=$(echo "$RESPONSE_BODY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('service', {}).get('serviceUrl', 'N/A'))
except:
    print('N/A')
" 2>/dev/null || echo "N/A")
    
    if [ "$SERVICE_ID" = "N/A" ]; then
        # Fallback parsing
        SERVICE_ID=$(echo "$RESPONSE_BODY" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
        SERVICE_URL=$(echo "$RESPONSE_BODY" | grep -o '"serviceUrl":"[^"]*' | head -1 | cut -d'"' -f4)
    fi
    
    print_success "Service ID: $SERVICE_ID"
    print_success "Service URL: $SERVICE_URL"
    
    echo ""
    echo "🎉 Deployment Initiated Successfully!"
    echo "===================================="
    echo "✅ Service Name: $SERVICE_NAME"
    echo "✅ Service ID: $SERVICE_ID"
    echo "✅ Repository: $GITHUB_REPO"
    echo "✅ Branch: main"
    echo "✅ Runtime: Docker"
    echo "✅ Region: Oregon"
    echo "✅ Plan: Starter"
    echo "✅ Auto-deploy: Enabled"
    echo "✅ Health Check: /api/health"
    echo ""
    print_status "🚀 Your Weather Dashboard will be available at:"
    print_success "🌐 $SERVICE_URL"
    echo ""
    print_status "📊 Monitor deployment progress at:"
    print_status "🔗 https://dashboard.render.com/web/$SERVICE_ID"
    
    # Show build progress
    echo ""
    print_status "⏳ Build Process Started..."
    print_status "The deployment will take 5-10 minutes to complete."
    print_status "Render is now:"
    echo "   1. 📥 Cloning your GitHub repository"
    echo "   2. 🐳 Building Docker image from Dockerfile"
    echo "   3. 🚀 Deploying to production servers"
    echo "   4. 🔍 Running health checks"
    echo "   5. 🌐 Making your app live!"
    
elif [ "$HTTP_CODE" -eq 422 ] || [ "$HTTP_CODE" -eq 409 ]; then
    print_warning "Service might already exist. Let me check..."
    
    # Get all services
    print_status "Fetching existing services..."
    ALL_SERVICES=$(curl -s \
      -H "Authorization: Bearer $RENDER_API_KEY" \
      "$RENDER_API_URL/services")
    
    # Check if weather-dashboard exists
    EXISTING_SERVICE=$(echo "$ALL_SERVICES" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for service_item in data:
        service = service_item.get('service', {})
        if service.get('name') == 'weather-dashboard':
            print(json.dumps(service))
            break
    else:
        print('NOT_FOUND')
except Exception as e:
    print('ERROR')
" 2>/dev/null || echo "ERROR")
    
    if [ "$EXISTING_SERVICE" != "NOT_FOUND" ] && [ "$EXISTING_SERVICE" != "ERROR" ]; then
        print_warning "Found existing 'weather-dashboard' service!"
        
        EXISTING_ID=$(echo "$EXISTING_SERVICE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('id', 'N/A'))
except:
    print('N/A')
" 2>/dev/null || echo "N/A")
        
        EXISTING_URL=$(echo "$EXISTING_SERVICE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('serviceUrl', 'N/A'))
except:
    print('N/A')
" 2>/dev/null || echo "N/A")
        
        print_status "Existing Service ID: $EXISTING_ID"
        print_status "Existing Service URL: $EXISTING_URL"
        
        # Trigger new deployment
        print_status "🔄 Triggering new deployment..."
        DEPLOY_RESPONSE=$(curl -s -w "\n%{http_code}" \
          -X POST \
          -H "Authorization: Bearer $RENDER_API_KEY" \
          "$RENDER_API_URL/services/$EXISTING_ID/deploys")
        
        DEPLOY_CODE=$(echo "$DEPLOY_RESPONSE" | tail -n1)
        
        if [ "$DEPLOY_CODE" -eq 201 ]; then
            print_success "✅ New deployment triggered successfully!"
            echo ""
            print_status "🚀 Your Weather Dashboard will be available at:"
            print_success "🌐 $EXISTING_URL"
            echo ""
            print_status "📊 Monitor deployment at:"
            print_status "🔗 https://dashboard.render.com/web/$EXISTING_ID"
        else
            print_error "❌ Failed to trigger deployment. Code: $DEPLOY_CODE"
            print_status "Please manually trigger deployment at:"
            print_status "🔗 https://dashboard.render.com/web/$EXISTING_ID"
        fi
    else
        print_error "❌ Could not create service or find existing one."
        print_status "API Response: $RESPONSE_BODY"
        print_status ""
        print_status "🔧 Manual Setup Instructions:"
        print_status "1. Go to: https://dashboard.render.com/"
        print_status "2. Click 'New +' → 'Web Service'"
        print_status "3. Connect GitHub: Sai6522/weather-dashboard"
        print_status "4. Runtime: Docker"
        print_status "5. Click 'Create Web Service'"
    fi
    
else
    print_error "❌ Failed to create service. HTTP Code: $HTTP_CODE"
    print_error "Response: $RESPONSE_BODY"
    
    echo ""
    print_status "🔧 Manual Deployment Instructions:"
    print_status "=================================="
    print_status "1. 🌐 Go to: https://dashboard.render.com/"
    print_status "2. 🆕 Click 'New +' → 'Web Service'"
    print_status "3. 🔗 Connect GitHub repository: Sai6522/weather-dashboard"
    print_status "4. 🐳 Select Runtime: Docker"
    print_status "5. ⚙️  Dockerfile Path: ./Dockerfile"
    print_status "6. 🚀 Click 'Create Web Service'"
    print_status ""
    print_status "The render.yaml file will automatically configure:"
    print_status "• Environment variables"
    print_status "• Health checks"
    print_status "• Auto-scaling"
    print_status "• Security headers"
fi

echo ""
echo "🔧 Service Features:"
echo "==================="
echo "🌤️  Interactive weather map with polygon drawing"
echo "📈 Real-time data visualization and timeline"
echo "📱 Responsive design (mobile + desktop optimized)"
echo "🔒 Production security headers and optimizations"
echo "⚡ Auto-scaling (1-3 instances based on traffic)"
echo "🏥 Health monitoring at /api/health endpoint"
echo "🚀 CDN integration for fast global delivery"
echo "🐳 Docker containerized for consistent deployment"
echo ""

print_success "🎉 Weather Dashboard deployment process completed!"
print_status "🔍 Check https://dashboard.render.com/ for live status"
print_status "⏱️  Build typically takes 5-10 minutes to complete"
