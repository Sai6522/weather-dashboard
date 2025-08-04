#!/bin/bash

# Weather Dashboard - Automated GitHub Deploy Script
# This script automatically creates a GitHub repository and pushes the code

set -e

echo "🌤️  Weather Dashboard - Automated GitHub Deployment"
echo "===================================================="

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if GitHub CLI is installed and authenticated
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) is not installed. Please install it first."
    exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
    print_error "Not logged in to GitHub. Please run: gh auth login"
    exit 1
fi

# Get GitHub username
github_username=$(gh api user --jq '.login')
print_status "Logged in as: $github_username"

# Repository details
REPO_NAME="weather-dashboard"
REPO_DESCRIPTION="🌤️ Interactive Weather Data Dashboard with real-time visualization, polygon drawing, and responsive design. Built with Next.js, TypeScript, and Docker."

print_status "Repository: $REPO_NAME"
print_status "Description: $REPO_DESCRIPTION"

# Check if repository already exists
if gh repo view "$github_username/$REPO_NAME" &> /dev/null; then
    print_warning "Repository $github_username/$REPO_NAME already exists."
    print_status "Repository URL: https://github.com/$github_username/$REPO_NAME"
    
    # Check if remote origin exists
    if git remote get-url origin &> /dev/null; then
        existing_origin=$(git remote get-url origin)
        expected_origin="https://github.com/$github_username/$REPO_NAME.git"
        
        if [ "$existing_origin" != "$expected_origin" ]; then
            print_status "Updating remote origin to match existing repository..."
            git remote set-url origin "$expected_origin"
        fi
    else
        print_status "Adding remote origin..."
        git remote add origin "https://github.com/$github_username/$REPO_NAME.git"
    fi
else
    print_status "Creating new GitHub repository..."
    
    # Create the repository
    gh repo create "$REPO_NAME" \
        --description "$REPO_DESCRIPTION" \
        --public \
        --clone=false \
        --add-readme=false
    
    print_success "Repository created: https://github.com/$github_username/$REPO_NAME"
    
    # Add remote origin
    git remote add origin "https://github.com/$github_username/$REPO_NAME.git" 2>/dev/null || \
    git remote set-url origin "https://github.com/$github_username/$REPO_NAME.git"
    
    print_success "Remote origin configured"
fi

# Ensure we're on the main branch
current_branch=$(git branch --show-current 2>/dev/null || echo "master")
if [ "$current_branch" != "main" ]; then
    print_status "Renaming branch from '$current_branch' to 'main'..."
    git branch -M main
    print_success "Branch renamed to 'main'"
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_status "Committing uncommitted changes..."
    git add .
    git commit -m "feat: Production-ready Weather Dashboard with Docker deployment

- Interactive weather map with polygon drawing
- Real-time data visualization and timeline
- Responsive design for mobile and desktop
- Production-ready Docker configuration
- Render deployment setup with auto-scaling
- Health monitoring and security headers
- TypeScript, Next.js 14, and modern React patterns"
    print_success "Changes committed"
fi

# Push to GitHub
print_status "Pushing to GitHub..."

# Check if branch exists on remote
if git ls-remote --heads origin main | grep -q main; then
    print_status "Pushing updates to existing branch..."
    git push origin main
else
    print_status "Pushing new branch to GitHub..."
    git push -u origin main
fi

print_success "Code successfully pushed to GitHub!"

# Get repository URL
repo_url="https://github.com/$github_username/$REPO_NAME"

# Display success information
echo ""
echo "🎉 GitHub Deployment Complete!"
echo "=============================="
echo "✅ Repository created/updated: $REPO_NAME"
echo "✅ Code pushed to GitHub"
echo "✅ Branch: main"
echo "✅ Remote origin configured"
echo ""
print_status "Repository URL: $repo_url"
print_status "Clone URL: https://github.com/$github_username/$REPO_NAME.git"
echo ""

# Show next steps for Render deployment
echo "🚀 Next Steps - Deploy to Render:"
echo "================================="
echo "1. Go to: https://dashboard.render.com/"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect GitHub and select: $github_username/$REPO_NAME"
echo "4. Runtime: Docker"
echo "5. Click 'Create Web Service'"
echo ""
echo "🔧 Render will automatically:"
echo "• Use the Dockerfile for building"
echo "• Apply render.yaml configuration"
echo "• Set up auto-scaling (1-3 instances)"
echo "• Configure health checks"
echo "• Apply security headers"
echo ""
print_success "Your Weather Dashboard will be live at: https://your-service-name.onrender.com"

# Optional: Open repository in browser
if command -v xdg-open &> /dev/null; then
    print_status "Opening repository in browser..."
    xdg-open "$repo_url" &
elif command -v open &> /dev/null; then
    print_status "Opening repository in browser..."
    open "$repo_url" &
fi

echo ""
print_success "Weather Dashboard deployment to GitHub completed! 🌤️"
print_status "Ready for Render deployment!"
