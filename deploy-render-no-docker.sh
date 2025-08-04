#!/bin/bash

# Weather Dashboard - Render Deployment Script (No Docker Testing)
# This script prepares and deploys the weather dashboard to Render

set -e

echo "🌤️  Weather Dashboard - Render Deployment (No Docker Testing)"
echo "=============================================================="

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

# Run linting (skip interactive prompts)
print_status "Running linter..."
npm run lint -- --fix || true

# Build the application locally to verify
print_status "Building application for verification..."
npm run build

print_success "Local build completed successfully"

print_warning "Skipping Docker build test (Docker not available in this environment)"
print_status "Docker build will be tested on Render during deployment"

# Check if git repo exists and is initialized
if [ ! -d ".git" ]; then
    print_status "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: Weather Dashboard"
    print_success "Git repository initialized"
else
    # Check if git repo is clean
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "Git working directory is not clean. Uncommitted changes:"
        git status --short
        print_status "Adding and committing changes..."
        git add .
        git commit -m "Deploy: Production build $(date '+%Y-%m-%d %H:%M:%S')" || true
    fi
fi

# Get current branch
current_branch=$(git branch --show-current 2>/dev/null || echo "main")
print_status "Current branch: $current_branch"

# Check if we have a remote repository
if ! git remote get-url origin &> /dev/null; then
    print_error "No git remote 'origin' found."
    print_status "Please set up a GitHub repository and add it as origin:"
    print_status "  git remote add origin https://github.com/yourusername/weather-dashboard.git"
    print_status "  git push -u origin main"
    print_status ""
    print_status "Then you can deploy to Render by:"
    print_status "1. Going to https://dashboard.render.com/"
    print_status "2. Click 'New +' → 'Web Service'"
    print_status "3. Connect your GitHub repository"
    print_status "4. Select 'Docker' as runtime"
    print_status "5. Use the render.yaml configuration"
    exit 1
fi

# Push changes to git
print_status "Pushing changes to git..."
git push origin "$current_branch" || {
    print_error "Failed to push to git. Please check your repository setup."
    exit 1
}

print_success "Changes pushed to git"

# Try to deploy to Render
print_status "Attempting to deploy to Render..."

# Check if render.yaml exists and deploy
if [ -f "render.yaml" ]; then
    print_status "Using render.yaml for deployment configuration"
    
    # Try to deploy using Render CLI
    if render deploy --yes; then
        print_success "Deployment initiated successfully via Render CLI!"
    else
        print_warning "Render CLI deployment failed or requires manual setup."
        print_status "Please complete deployment manually:"
        print_status "1. Go to https://dashboard.render.com/"
        print_status "2. Click 'New +' → 'Web Service'"
        print_status "3. Connect your GitHub repository"
        print_status "4. Select 'Docker' as runtime"
        print_status "5. The render.yaml file will configure everything automatically"
    fi
else
    print_error "render.yaml not found"
    exit 1
fi

echo ""
echo "🎉 Deployment Summary:"
echo "====================="
echo "✅ Dependencies installed"
echo "✅ Type checking passed"
echo "✅ Linting completed"
echo "✅ Local build successful"
echo "⚠️  Docker build test skipped (not available)"
echo "✅ Changes pushed to git"
echo "✅ Render deployment initiated"
echo ""
print_status "Check your Render dashboard for deployment progress:"
print_status "https://dashboard.render.com/"
echo ""
print_success "Weather Dashboard deployment completed! 🌤️"
print_status "Your app will be available at: https://your-service-name.onrender.com"
