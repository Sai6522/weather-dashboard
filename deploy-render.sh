#!/bin/bash

# Weather Dashboard - Render Deployment Script
# This script prepares and deploys the weather dashboard to Render

set -e

echo "🌤️  Weather Dashboard - Render Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if Render CLI is installed
if ! command -v render &> /dev/null; then
    print_warning "Render CLI not found. Installing..."
    npm install -g @render/cli
    print_success "Render CLI installed successfully"
fi

# Verify Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH. Please install Docker first."
    exit 1
fi

print_status "Checking project structure..."

# Verify required files exist
required_files=("Dockerfile" "render.yaml" "next.config.js" "package.json")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file $file not found"
        exit 1
    fi
done

print_success "All required files found"

# Clean up previous builds
print_status "Cleaning up previous builds..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf out

# Install dependencies
print_status "Installing dependencies..."
npm ci --frozen-lockfile

# Run type checking
print_status "Running type checks..."
npm run type-check

# Run linting
print_status "Running linter..."
npm run lint

# Build the application locally to verify
print_status "Building application for verification..."
npm run build

print_success "Local build completed successfully"

# Test Docker build locally
print_status "Testing Docker build locally..."
docker build -t weather-dashboard-test . --no-cache

print_success "Docker build test completed successfully"

# Clean up test image
docker rmi weather-dashboard-test

# Check if git repo is clean
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Git working directory is not clean. Uncommitted changes:"
    git status --short
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
fi

# Push to git if needed
current_branch=$(git branch --show-current)
print_status "Current branch: $current_branch"

if [ "$current_branch" != "main" ]; then
    print_warning "You're not on the main branch. Render typically deploys from main."
    read -p "Do you want to continue with branch '$current_branch'? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
fi

# Push changes to git
print_status "Pushing changes to git..."
git add .
git commit -m "Deploy: Production build $(date '+%Y-%m-%d %H:%M:%S')" || true
git push origin "$current_branch"

print_success "Changes pushed to git"

# Deploy to Render
print_status "Deploying to Render..."

# Check if render.yaml exists and deploy
if [ -f "render.yaml" ]; then
    print_status "Using render.yaml for deployment configuration"
    render deploy
else
    print_error "render.yaml not found"
    exit 1
fi

print_success "Deployment initiated successfully!"

echo ""
echo "🎉 Deployment Summary:"
echo "====================="
echo "✅ Dependencies installed"
echo "✅ Type checking passed"
echo "✅ Linting passed"
echo "✅ Local build successful"
echo "✅ Docker build tested"
echo "✅ Changes pushed to git"
echo "✅ Render deployment initiated"
echo ""
print_status "Check your Render dashboard for deployment progress:"
print_status "https://dashboard.render.com/"
echo ""
print_success "Weather Dashboard deployment completed! 🌤️"
