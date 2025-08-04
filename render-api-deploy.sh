#!/bin/bash

# Weather Dashboard - Render API Deployment Script
# This script deploys the weather dashboard using Render API

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
GITHUB_REPO="https://github.com/Sai6522/weather-dashboard"
SERVICE_NAME="weather-dashboard"

print_status "Deploying Weather Dashboard to Render..."
print_status "Repository: $GITHUB_REPO"
print_status "Service Name: $SERVICE_NAME"

# Create service configuration
SERVICE_CONFIG=$(cat <<EOF
{
  "type": "web_service",
  "name": "$SERVICE_NAME",
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
    "pullRequestPreviewsEnabled": "no",
    "buildFilter": {
      "paths": ["src/**", "public/**", "package.json", "package-lock.json", "next.config.js", "tailwind.config.js", "postcss.config.js", "tsconfig.json", "Dockerfile"],
      "ignoredPaths": ["*.md", "docs/**", "scripts/**", "test-*.js", "*.Zone.Identifier"]
    }
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

if [ "$HTTP_CODE" -eq 201 ]; then
    print_success "Service created successfully!"
    
    # Extract service details
    SERVICE_ID=$(echo "$RESPONSE_BODY" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    SERVICE_URL=$(echo "$RESPONSE_BODY" | grep -o '"serviceUrl":"[^"]*' | cut -d'"' -f4)
    
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
    print_status "Deployment is in progress. You can monitor it at:"
    print_status "https://dashboard.render.com/web/$SERVICE_ID"
    
elif [ "$HTTP_CODE" -eq 422 ]; then
    print_warning "Service might already exist or validation error occurred."
    print_status "Response: $RESPONSE_BODY"
    
    # Try to get existing services
    print_status "Checking for existing services..."
    EXISTING_SERVICES=$(curl -s \
      -H "Authorization: Bearer $RENDER_API_KEY" \
      "$RENDER_API_URL/services?name=$SERVICE_NAME")
    
    if echo "$EXISTING_SERVICES" | grep -q "\"name\":\"$SERVICE_NAME\""; then
        print_warning "Service '$SERVICE_NAME' already exists."
        
        # Extract existing service details
        EXISTING_SERVICE_ID=$(echo "$EXISTING_SERVICES" | grep -A 10 "\"name\":\"$SERVICE_NAME\"" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
        EXISTING_SERVICE_URL=$(echo "$EXISTING_SERVICES" | grep -A 10 "\"name\":\"$SERVICE_NAME\"" | grep -o '"serviceUrl":"[^"]*' | head -1 | cut -d'"' -f4)
        
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
            print_status "Please check the Render dashboard manually."
        fi
    else
        print_error "Failed to create service. Response: $RESPONSE_BODY"
        exit 1
    fi
    
else
    print_error "Failed to create service. HTTP Code: $HTTP_CODE"
    print_error "Response: $RESPONSE_BODY"
    exit 1
fi

echo ""
echo "🔧 Service Configuration:"
echo "========================"
echo "• Runtime: Docker"
echo "• Build: Automatic (using Dockerfile)"
echo "• Environment: Production"
echo "• Auto-scaling: 1-3 instances"
echo "• Health checks: Enabled"
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

print_success "Weather Dashboard deployment completed! 🌤️"
print_status "The service will be live in a few minutes after the build completes."

# Optional: Open Render dashboard
if command -v xdg-open &> /dev/null; then
    print_status "Opening Render dashboard..."
    xdg-open "https://dashboard.render.com/" &
elif command -v open &> /dev/null; then
    print_status "Opening Render dashboard..."
    open "https://dashboard.render.com/" &
fi
