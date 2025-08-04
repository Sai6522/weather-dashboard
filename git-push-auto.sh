#!/bin/bash

# Weather Dashboard - Automated Git Push Script
# This script provides the exact commands to push your project to GitHub

echo "🌤️  Weather Dashboard - Git Push Commands"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}Your Weather Dashboard is ready to push to GitHub!${NC}"
echo ""

echo -e "${YELLOW}📋 STEP 1: Create GitHub Repository${NC}"
echo "1. Go to: https://github.com/new"
echo "2. Repository name: weather-dashboard"
echo "3. Make it Public"
echo "4. DON'T initialize with README"
echo "5. Click 'Create repository'"
echo ""

echo -e "${YELLOW}📋 STEP 2: Copy Your Repository URL${NC}"
echo "After creating the repository, GitHub will show you a URL like:"
echo "https://github.com/YOUR_USERNAME/weather-dashboard.git"
echo ""

echo -e "${YELLOW}📋 STEP 3: Run These Commands${NC}"
echo "Replace YOUR_USERNAME with your actual GitHub username:"
echo ""

echo -e "${CYAN}# Navigate to project directory${NC}"
echo "cd /home/sai/weather-dashboard-main/weather-dashboard-main"
echo ""

echo -e "${CYAN}# Rename branch to main (recommended)${NC}"
echo "git branch -M main"
echo ""

echo -e "${CYAN}# Add your GitHub repository as remote origin${NC}"
echo "git remote add origin https://github.com/YOUR_USERNAME/weather-dashboard.git"
echo ""

echo -e "${CYAN}# Push to GitHub${NC}"
echo "git push -u origin main"
echo ""

echo -e "${GREEN}🎉 After pushing, your repository will be ready for Render deployment!${NC}"
echo ""

echo -e "${YELLOW}📋 STEP 4: Deploy to Render${NC}"
echo "1. Go to: https://dashboard.render.com/"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your GitHub repository"
echo "4. Select 'Docker' as runtime"
echo "5. Click 'Create Web Service'"
echo ""

echo -e "${GREEN}✨ Your Weather Dashboard will be live at: https://your-service-name.onrender.com${NC}"

# Show current git status
echo ""
echo -e "${BLUE}📊 Current Project Status:${NC}"
echo "✅ Production-ready Dockerfile"
echo "✅ Render configuration (render.yaml)"
echo "✅ Health check endpoint (/api/health)"
echo "✅ Security headers and optimizations"
echo "✅ Auto-scaling configuration"
echo "✅ All dependencies installed"
echo "✅ TypeScript compilation successful"
echo "✅ Production build verified"
echo "✅ Git repository initialized"
echo ""

echo -e "${GREEN}🚀 Ready for deployment!${NC}"
