#!/bin/bash

# Pre-deployment checklist for Vercel
echo "🔍 Pre-Deployment Checklist for Vercel"
echo "======================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in project directory. Please run from weather-dashboard folder."
    exit 1
fi

echo "1️⃣ Checking project files..."

# Check required files
required_files=("package.json" "next.config.js" "vercel.json" "src/app/layout.tsx" "src/app/page.tsx")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "$file exists"
    else
        print_error "$file is missing"
        exit 1
    fi
done

echo "2️⃣ Testing build process..."

# Test build
if npm run build > /dev/null 2>&1; then
    print_status "Build successful"
else
    print_error "Build failed. Please fix build errors before deploying."
    echo "Run 'npm run build' to see detailed errors."
    exit 1
fi

echo "3️⃣ Checking dependencies..."

# Check for security vulnerabilities
if npm audit --audit-level=high > /dev/null 2>&1; then
    print_status "No high-severity vulnerabilities found"
else
    print_warning "Security vulnerabilities detected. Consider running 'npm audit fix'"
fi

echo "4️⃣ Validating configuration..."

# Check vercel.json
if node -e "JSON.parse(require('fs').readFileSync('vercel.json', 'utf8'))" 2>/dev/null; then
    print_status "vercel.json is valid"
else
    print_error "vercel.json has syntax errors"
    exit 1
fi

# Check next.config.js
if node -e "require('./next.config.js')" 2>/dev/null; then
    print_status "next.config.js is valid"
else
    print_error "next.config.js has syntax errors"
    exit 1
fi

echo "5️⃣ Checking Git status..."

# Check if git is initialized
if [ -d ".git" ]; then
    print_status "Git repository initialized"
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "Uncommitted changes detected"
        echo "Consider committing changes before deployment:"
        echo "  git add ."
        echo "  git commit -m 'Ready for deployment'"
        echo "  git push origin main"
    else
        print_status "No uncommitted changes"
    fi
else
    print_warning "Git not initialized. Consider initializing git repository:"
    echo "  git init"
    echo "  git add ."
    echo "  git commit -m 'Initial commit'"
fi

echo "6️⃣ Estimating deployment size..."

# Calculate project size
if command -v du &> /dev/null; then
    size=$(du -sh . 2>/dev/null | cut -f1)
    print_status "Project size: $size"
fi

echo ""
echo "🎯 Pre-deployment Summary:"
echo "========================="
print_status "All required files present"
print_status "Build process successful"
print_status "Configuration files valid"
print_status "Ready for Vercel deployment"

echo ""
echo "🚀 Next Steps:"
echo "1. Commit and push your code to GitHub (if not done)"
echo "2. Go to vercel.com and import your repository"
echo "3. Or run: npm run deploy:vercel"
echo ""
echo "📱 After deployment:"
echo "- Test your live application"
echo "- Check the health endpoint: /api/health"
echo "- Monitor performance in Vercel dashboard"

echo ""
print_status "Ready to deploy! 🚀"
