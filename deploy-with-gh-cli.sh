#!/bin/bash

echo "🚀 Weather Dashboard - GitHub CLI Deployment"
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in the weather-dashboard directory"
    exit 1
fi

print_step "1️⃣ Checking GitHub CLI authentication..."

# Check if already authenticated
if gh auth status &>/dev/null; then
    print_success "Already authenticated with GitHub"
else
    print_step "🔐 Authenticating with GitHub..."
    echo "Please choose your authentication method:"
    echo "1. Browser (recommended)"
    echo "2. Token"
    
    read -p "Choose option (1 or 2): " auth_choice
    
    case $auth_choice in
        1)
            print_step "Opening browser for authentication..."
            gh auth login --web
            ;;
        2)
            print_step "Token authentication..."
            gh auth login --with-token
            ;;
        *)
            print_error "Invalid choice. Using browser authentication..."
            gh auth login --web
            ;;
    esac
fi

# Verify authentication
if ! gh auth status &>/dev/null; then
    print_error "Authentication failed. Please try again."
    exit 1
fi

print_success "GitHub authentication successful"

print_step "2️⃣ Creating GitHub repository..."

# Get repository name
REPO_NAME="weather-dashboard"
REPO_DESCRIPTION="Interactive Weather Data Dashboard with Polygon Analysis and Time-based Filtering"

# Check if repository already exists
if gh repo view $REPO_NAME &>/dev/null; then
    print_warning "Repository '$REPO_NAME' already exists"
    read -p "Do you want to use the existing repository? (y/n): " use_existing
    
    if [[ $use_existing != "y" && $use_existing != "Y" ]]; then
        read -p "Enter a new repository name: " REPO_NAME
    fi
else
    # Create new repository
    print_step "Creating new repository: $REPO_NAME"
    
    gh repo create $REPO_NAME \
        --description "$REPO_DESCRIPTION" \
        --public \
        --clone=false \
        --add-readme=false
    
    if [ $? -eq 0 ]; then
        print_success "Repository created successfully"
    else
        print_error "Failed to create repository"
        exit 1
    fi
fi

print_step "3️⃣ Configuring git remote..."

# Get the repository URL
REPO_URL=$(gh repo view $REPO_NAME --json url -q .url)
print_success "Repository URL: $REPO_URL"

# Add or update remote
if git remote get-url origin &>/dev/null; then
    print_step "Updating existing remote origin..."
    git remote set-url origin $REPO_URL
else
    print_step "Adding remote origin..."
    git remote add origin $REPO_URL
fi

print_step "4️⃣ Preparing final commit..."

# Add any uncommitted files
if [ -n "$(git status --porcelain)" ]; then
    print_step "Adding uncommitted files..."
    git add .
    git commit -m "Final deployment preparation - ready for Vercel"
fi

print_step "5️⃣ Pushing to GitHub..."

# Push to GitHub
git push -u origin main

if [ $? -eq 0 ]; then
    print_success "Code successfully pushed to GitHub!"
else
    print_error "Failed to push to GitHub"
    exit 1
fi

print_step "6️⃣ Opening repository in browser..."
gh repo view $REPO_NAME --web

echo ""
echo "🎉 SUCCESS! Your Weather Dashboard is now on GitHub!"
echo "=================================================="
echo ""
echo "📊 Repository Details:"
echo "   Name: $REPO_NAME"
echo "   URL: $REPO_URL"
echo "   Description: $REPO_DESCRIPTION"
echo ""
echo "📦 What's included:"
echo "   ✅ Next.js 14 Weather Dashboard"
echo "   ✅ Interactive map with polygon drawing"
echo "   ✅ Time-based polygon filtering"
echo "   ✅ Docker configuration"
echo "   ✅ Vercel deployment config"
echo "   ✅ Health check API endpoint"
echo "   ✅ Performance optimizations"
echo "   ✅ Complete documentation"
echo ""
echo "🚀 Next Steps - Deploy to Vercel:"
echo "   1. Go to https://vercel.com"
echo "   2. Sign in with your GitHub account"
echo "   3. Click 'New Project'"
echo "   4. Import your '$REPO_NAME' repository"
echo "   5. Click 'Deploy' (all settings auto-configured!)"
echo ""
echo "🔍 Test endpoints after deployment:"
echo "   • Main app: https://your-app.vercel.app"
echo "   • Health check: https://your-app.vercel.app/api/health"
echo ""
echo "⏱️  Expected deployment time: 2-3 minutes"
echo "🌍 Your app will be available globally via Vercel's edge network"
echo ""
print_success "Deployment preparation complete! 🎯"
