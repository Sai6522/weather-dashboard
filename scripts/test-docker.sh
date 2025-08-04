#!/bin/bash

# Docker Test Script for Weather Dashboard
set -e

echo "🧪 Testing Docker Build and Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up..."
    docker stop weather-dashboard-test 2>/dev/null || true
    docker rm weather-dashboard-test 2>/dev/null || true
    docker rmi weather-dashboard-test 2>/dev/null || true
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Step 1: Check if Docker is running
echo "1️⃣ Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running"
    exit 1
fi

print_status "Docker is running"

# Step 2: Build the Docker image
echo "2️⃣ Building Docker image..."
if docker build -t weather-dashboard-test .; then
    print_status "Docker image built successfully"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Step 3: Run the container
echo "3️⃣ Starting Docker container..."
if docker run -d -p 3001:3000 --name weather-dashboard-test weather-dashboard-test; then
    print_status "Container started successfully"
else
    print_error "Failed to start container"
    exit 1
fi

# Step 4: Wait for the application to start
echo "4️⃣ Waiting for application to start..."
sleep 10

# Step 5: Test health endpoint
echo "5️⃣ Testing health endpoint..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:3001/api/health &> /dev/null; then
        print_status "Health check passed"
        break
    else
        if [ $attempt -eq $max_attempts ]; then
            print_error "Health check failed after $max_attempts attempts"
            echo "Container logs:"
            docker logs weather-dashboard-test
            exit 1
        fi
        echo "Attempt $attempt/$max_attempts failed, retrying in 2 seconds..."
        sleep 2
        ((attempt++))
    fi
done

# Step 6: Test main application
echo "6️⃣ Testing main application..."
if curl -f http://localhost:3001 &> /dev/null; then
    print_status "Main application is responding"
else
    print_warning "Main application test failed, but health check passed"
fi

# Step 7: Display container info
echo "7️⃣ Container information:"
echo "Container ID: $(docker ps -q -f name=weather-dashboard-test)"
echo "Container Status: $(docker ps -f name=weather-dashboard-test --format 'table {{.Status}}')"
echo "Port Mapping: 3001:3000"
echo "Health Endpoint: http://localhost:3001/api/health"
echo "Application URL: http://localhost:3001"

# Step 8: Show resource usage
echo "8️⃣ Resource usage:"
docker stats weather-dashboard-test --no-stream

print_status "Docker test completed successfully!"
print_warning "Container is still running on port 3001 for manual testing"
print_warning "Run 'docker stop weather-dashboard-test && docker rm weather-dashboard-test' to clean up"

# Don't cleanup automatically so user can test manually
trap - EXIT
