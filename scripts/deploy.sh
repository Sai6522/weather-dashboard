#!/bin/bash

# Weather Dashboard Deployment Script
set -e

echo "🚀 Weather Dashboard Deployment Script"
echo "======================================="

# Function to display usage
usage() {
    echo "Usage: $0 [docker|render|vercel|local]"
    echo ""
    echo "Options:"
    echo "  docker  - Build and run Docker container locally"
    echo "  render  - Deploy to Render (requires render CLI)"
    echo "  vercel  - Deploy to Vercel (requires vercel CLI)"
    echo "  local   - Run local development server"
    exit 1
}

# Check if argument is provided
if [ $# -eq 0 ]; then
    usage
fi

case $1 in
    "docker")
        echo "🐳 Building Docker image..."
        docker build -t weather-dashboard .
        
        echo "🏃 Running Docker container..."
        docker run -p 3000:3000 --name weather-dashboard-container weather-dashboard
        ;;
    
    "render")
        echo "🌐 Deploying to Render..."
        if ! command -v render &> /dev/null; then
            echo "❌ Render CLI not found. Please install it first:"
            echo "npm install -g @render/cli"
            exit 1
        fi
        
        echo "📦 Building application..."
        npm run build
        
        echo "🚀 Deploying to Render..."
        render deploy
        ;;
    
    "vercel")
        echo "▲ Deploying to Vercel..."
        if ! command -v vercel &> /dev/null; then
            echo "❌ Vercel CLI not found. Please install it first:"
            echo "npm install -g vercel"
            exit 1
        fi
        
        echo "📦 Building application..."
        npm run build
        
        echo "🚀 Deploying to Vercel..."
        vercel --prod
        ;;
    
    "local")
        echo "💻 Starting local development server..."
        npm install
        npm run dev
        ;;
    
    *)
        echo "❌ Invalid option: $1"
        usage
        ;;
esac

echo "✅ Deployment completed!"
