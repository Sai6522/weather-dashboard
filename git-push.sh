#!/bin/bash

# Weather Dashboard - Git Push Script
# This script helps you push the weather dashboard project to GitHub

set -e

echo "🌤️  Weather Dashboard - Git Push Script"
echo "========================================"

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

print_prompt() {
    echo -e "${CYAN}[INPUT]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_status "Weather Dashboard Git Push Setup"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_error "Git repository not initialized. Please run the deployment script first."
    exit 1
fi

# Check git configuration
git_user_name=$(git config user.name 2>/dev/null || echo "")
git_user_email=$(git config user.email 2>/dev/null || echo "")

if [ -z "$git_user_name" ] || [ -z "$git_user_email" ]; then
    print_warning "Git user configuration not found. Let's set it up."
    echo ""
    
    if [ -z "$git_user_name" ]; then
        print_prompt "Enter your name for git commits:"
        read -r user_name
        git config user.name "$user_name"
        print_success "Git user name set to: $user_name"
    fi
    
    if [ -z "$git_user_email" ]; then
        print_prompt "Enter your email for git commits:"
        read -r user_email
        git config user.email "$user_email"
        print_success "Git user email set to: $user_email"
    fi
    echo ""
fi

# Check current branch
current_branch=$(git branch --show-current 2>/dev/null || echo "master")
print_status "Current branch: $current_branch"

# Suggest renaming to main if on master
if [ "$current_branch" = "master" ]; then
    print_warning "You're on 'master' branch. GitHub recommends using 'main'."
    print_prompt "Would you like to rename the branch to 'main'? (y/N):"
    read -r rename_branch
    if [[ $rename_branch =~ ^[Yy]$ ]]; then
        git branch -M main
        current_branch="main"
        print_success "Branch renamed to 'main'"
    fi
fi

# Check if remote origin exists
if git remote get-url origin &> /dev/null; then
    origin_url=$(git remote get-url origin)
    print_status "Remote origin already exists: $origin_url"
    
    print_prompt "Do you want to use this remote? (Y/n):"
    read -r use_existing
    if [[ $use_existing =~ ^[Nn]$ ]]; then
        print_prompt "Enter new GitHub repository URL (https://github.com/username/repo.git):"
        read -r new_repo_url
        git remote set-url origin "$new_repo_url"
        print_success "Remote origin updated to: $new_repo_url"
    fi
else
    print_status "No remote origin found. Let's add one."
    echo ""
    print_status "First, create a new repository on GitHub:"
    print_status "1. Go to: https://github.com/new"
    print_status "2. Repository name: weather-dashboard"
    print_status "3. Make it Public"
    print_status "4. DON'T initialize with README (we already have files)"
    print_status "5. Click 'Create repository'"
    echo ""
    
    print_prompt "Enter your GitHub repository URL (https://github.com/username/weather-dashboard.git):"
    read -r repo_url
    
    # Validate URL format
    if [[ ! $repo_url =~ ^https://github\.com/.+/.+\.git$ ]]; then
        print_error "Invalid GitHub URL format. Should be: https://github.com/username/repo.git"
        exit 1
    fi
    
    git remote add origin "$repo_url"
    print_success "Remote origin added: $repo_url"
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes:"
    git status --short
    echo ""
    
    print_prompt "Do you want to commit these changes? (Y/n):"
    read -r commit_changes
    if [[ ! $commit_changes =~ ^[Nn]$ ]]; then
        print_prompt "Enter commit message (or press Enter for default):"
        read -r commit_message
        
        if [ -z "$commit_message" ]; then
            commit_message="Update: Weather Dashboard $(date '+%Y-%m-%d %H:%M:%S')"
        fi
        
        git add .
        git commit -m "$commit_message"
        print_success "Changes committed: $commit_message"
    fi
fi

# Show current status
echo ""
print_status "Repository Status:"
echo "  📁 Project: Weather Dashboard"
echo "  🌿 Branch: $current_branch"
echo "  🔗 Remote: $(git remote get-url origin)"
echo "  📝 Last commit: $(git log -1 --pretty=format:'%h - %s (%cr)')"
echo ""

# Push to GitHub
print_status "Pushing to GitHub..."

# Check if branch exists on remote
if git ls-remote --heads origin "$current_branch" | grep -q "$current_branch"; then
    print_status "Branch '$current_branch' exists on remote. Pushing updates..."
    git push origin "$current_branch"
else
    print_status "Branch '$current_branch' doesn't exist on remote. Creating and pushing..."
    git push -u origin "$current_branch"
fi

print_success "Successfully pushed to GitHub!"

# Show next steps
echo ""
echo "🎉 Git Push Complete!"
echo "===================="
echo "✅ Code pushed to GitHub"
echo "✅ Repository is ready for deployment"
echo ""
print_status "Next Steps:"
echo "1. 🚀 Deploy to Render:"
echo "   • Go to: https://dashboard.render.com/"
echo "   • Click 'New +' → 'Web Service'"
echo "   • Connect your GitHub repository"
echo "   • Select 'Docker' runtime"
echo "   • Click 'Create Web Service'"
echo ""
echo "2. 🔍 View your repository:"
echo "   • $(git remote get-url origin | sed 's/\.git$//')"
echo ""
echo "3. 📊 Monitor deployment:"
echo "   • Health check: https://your-app.onrender.com/api/health"
echo ""
print_success "Weather Dashboard is ready for production! 🌤️"

# Optional: Open GitHub repository
print_prompt "Would you like to open your GitHub repository in the browser? (y/N):"
read -r open_browser
if [[ $open_browser =~ ^[Yy]$ ]]; then
    repo_web_url=$(git remote get-url origin | sed 's/\.git$//')
    if command -v xdg-open &> /dev/null; then
        xdg-open "$repo_web_url"
    elif command -v open &> /dev/null; then
        open "$repo_web_url"
    else
        print_status "Please open this URL in your browser: $repo_web_url"
    fi
fi
