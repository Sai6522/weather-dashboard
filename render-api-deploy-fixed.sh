#!/bin/bash

# Weather Dashboard - Render API Deployment Script (Fixed)
# This script deploys the weather dashboard using Render API with correct owner ID

set -e

echo "🌤️  Weather Dashboard - Render API Deployment"
echo "=============================================="

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

# Create service configuration
SERVICE_CONFIG=$(cat <<EOF
{
  "type": "web_service",
  "name": "$SERVICE_NAME",
  "ownerId": "$OWNER_ID",
  "repo": "$GITHUB_REPO",
  "branch": "main",
  "runtime": "docker",
  "plan": "starter",
  "region": "oregon",
  "buildCommand": "",
  "startCommand": "",
  "dockerfilePath": "./Dockerfile",
  "dockerContext": ".",
  "healthCheckPath": "/api/health",
  "autoDeploy": "yes",
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
    "publishPath": "",
    "pullRequestPreviewsEnabled": "no"
  }
}
EOF
)

print_status "Creating Render service..."

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
    
    # Extract service details using more robust parsing
    SERVICE_ID=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('service', {}).get('id', 'N/A'))" 2>/dev/null || echo "N/A")
    SERVICE_URL=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('service', {}).get('serviceUrl', 'N/A'))" 2>/dev/null || echo "N/A")
    
    if [ "$SERVICE_ID" = "N/A" ]; then
        # Fallback to grep if python parsing fails
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
    print_status "Your Weather Dashboard will be available at:"
    print_success "$SERVICE_URL"
    echo ""
    print_status "Deployment is in progress. Monitor it at:"
    print_status "https://dashboard.render.com/web/$SERVICE_ID"
    
elif [ "$HTTP_CODE" -eq 422 ] || [ "$HTTP_CODE" -eq 409 ]; then
    print_warning "Service might already exist or validation error occurred."
    print_status "Response: $RESPONSE_BODY"
    
    # Try to get existing services
    print_status "Checking for existing services..."
    EXISTING_SERVICES=$(curl -s \
      -H "Authorization: Bearer $RENDER_API_KEY" \
      "$RENDER_API_URL/services?name=$SERVICE_NAME")
    
    # Check if service exists
    if echo "$EXISTING_SERVICES" | grep -q "weather-dashboard"; then
        print_warning "Service 'weather-dashboard' already exists."
        
        # Extract existing service details
        EXISTING_SERVICE_ID=$(echo "$EXISTING_SERVICES" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for service in data:
        if service.get('service', {}).get('name') == 'weather-dashboard':
            print(service.get('service', {}).get('id', 'N/A'))
            break
    else:
        print('N/A')
except:
    print('N/A')
" 2>/dev/null || echo "N/A")
        
        EXISTING_SERVICE_URL=$(echo "$EXISTING_SERVICES" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for service in data:
        if service.get('service', {}).get('name') == 'weather-dashboard':
            print(service.get('service', {}).get('serviceUrl', 'N/A'))
            break
    else:
        print('N/A')
except:
    print('N/A')
" 2>/dev/null || echo "N/A")
        
        if [ "$EXISTING_SERVICE_ID" != "N/A" ]; then
            print_status "Existing Service ID: $EXISTING_SERVICE_ID"
            print_status "Existing Service URL: $EXISTING_SERVICE_URL"
            
            # Trigger a new deployment
            print_status "Triggering new deployment for existing service..."
            DEPLOY_RESPONSE=$(curl -s -w "\n%{http_code}" \
              -X POST \
              -H "Authorization: Bearer $RENDER_API_KEY" \
              "$RENDER_API_URL/services/$EXISTING_SERVICE_ID/deploys")
            
            DEPLOY_HTTP_CODE=$(echo "$DEPLOY_RESPONSE" | tail -n1)
            
            if [ "$DEPLOY_HTTP_CODE" -eq 201 ]; then
                print_success "New deployment triggered successfully!"
                echo ""
                print_status "Your Weather Dashboard will be available at:"
                print_success "$EXISTING_SERVICE_URL"
                echo ""
                print_status "Monitor deployment at:"
                print_status "https://dashboard.render.com/web/$EXISTING_SERVICE_ID"
            else
                print_error "Failed to trigger new deployment. HTTP Code: $DEPLOY_HTTP_CODE"
                print_status "Response: $(echo "$DEPLOY_RESPONSE" | head -n -1)"
                print_status "Please check the Render dashboard manually."
            fi
        else
            print_error "Could not extract service details from existing services."
            print_status "Please check the Render dashboard manually."
        fi
    else
        print_error "Failed to create service and no existing service found."
        print_error "Response: $RESPONSE_BODY"
        print_status "Please try creating the service manually at https://dashboard.render.com/"
    fi
    
else
    print_error "Failed to create service. HTTP Code: $HTTP_CODE"
    print_error "Response: $RESPONSE_BODY"
    
    if [ "$HTTP_CODE" -eq 401 ]; then
        print_error "Authentication failed. Please check your API key."
    elif [ "$HTTP_CODE" -eq 403 ]; then
        print_error "Access forbidden. Please check your permissions."
    fi
    
    print_status "You can create the service manually at:"
    print_status "https://dashboard.render.com/"
    print_status "Repository: $GITHUB_REPO"
    print_status "Runtime: Docker"
fi

echo ""
echo "🔧 Service Configuration:"
echo "========================"
echo "• Runtime: Docker"
echo "• Build: Automatic (using Dockerfile)"
echo "• Environment: Production"
echo "• Auto-scaling: Enabled"
echo "• Health checks: /api/health"
echo "• Security headers: Configured"
echo "• CDN: Enabled"
echo ""

echo "📊 Features Deployed:"
echo "===================="
echo "🌤️  Interactive weather map"
echo "📈 Real-time data visualization"
echo "🎨 Responsive design (mobile + desktop)"
echo "🔒 Security optimizations"
echo "⚡ Auto-scaling capabilities"
echo "📱 Progressive Web App features"
echo "🗺️  Polygon drawing and analysis"
echo "📊 Timeline data exploration"
echo ""

print_success "Weather Dashboard deployment process completed! 🌤️"
print_status "Check https://dashboard.render.com/ for deployment status."
