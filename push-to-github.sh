#!/bin/bash

echo "🚀 Pushing Weather Dashboard to GitHub"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the weather-dashboard directory"
    exit 1
fi

# Prompt for GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ Error: GitHub username is required"
    exit 1
fi

# Set the repository URL
REPO_URL="https://github.com/$GITHUB_USERNAME/weather-dashboard.git"

echo "📡 Repository URL: $REPO_URL"

# Add remote origin
echo "🔗 Adding remote origin..."
git remote add origin $REPO_URL 2>/dev/null || git remote set-url origin $REPO_URL

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🌐 Repository URL: https://github.com/$GITHUB_USERNAME/weather-dashboard"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Go to vercel.com"
    echo "2. Sign in with GitHub"
    echo "3. Import your weather-dashboard repository"
    echo "4. Click Deploy!"
    echo ""
    echo "📊 Your repository contains:"
    echo "- ✅ Next.js 14 application"
    echo "- ✅ Docker configuration"
    echo "- ✅ Vercel deployment config"
    echo "- ✅ Health check API"
    echo "- ✅ Complete documentation"
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "1. Repository exists on GitHub"
    echo "2. You have push permissions"
    echo "3. GitHub username is correct"
    echo ""
    echo "💡 Manual commands:"
    echo "git remote add origin $REPO_URL"
    echo "git push -u origin main"
fi
