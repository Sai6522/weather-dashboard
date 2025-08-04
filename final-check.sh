#!/bin/bash

echo "🔍 Final Deployment Readiness Check"
echo "==================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_passed=0
check_total=0

check_item() {
    ((check_total++))
    if eval "$2"; then
        echo -e "${GREEN}✅ $1${NC}"
        ((check_passed++))
    else
        echo -e "${RED}❌ $1${NC}"
    fi
}

check_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "📋 Checking project files..."
check_item "package.json exists" "[ -f package.json ]"
check_item "next.config.js exists" "[ -f next.config.js ]"
check_item "vercel.json exists" "[ -f vercel.json ]"
check_item "Dockerfile exists" "[ -f Dockerfile ]"
check_item "Health API exists" "[ -f src/app/api/health/route.ts ]"

echo ""
echo "🔧 Checking tools..."
check_item "Node.js installed" "command -v node >/dev/null 2>&1"
check_item "npm installed" "command -v npm >/dev/null 2>&1"
check_item "Git installed" "command -v git >/dev/null 2>&1"
check_item "GitHub CLI installed" "command -v gh >/dev/null 2>&1"

echo ""
echo "📦 Checking build..."
if npm run build >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Build successful${NC}"
    ((check_passed++))
else
    echo -e "${RED}❌ Build failed${NC}"
fi
((check_total++))

echo ""
echo "📊 Summary:"
echo "==========="
echo "Checks passed: $check_passed/$check_total"

if [ $check_passed -eq $check_total ]; then
    echo -e "${GREEN}🎉 All checks passed! Ready for deployment!${NC}"
    echo ""
    echo "🚀 To deploy, run:"
    echo "   ./deploy-with-gh-cli.sh"
    echo ""
    echo "📋 What will happen:"
    echo "   1. Authenticate with GitHub"
    echo "   2. Create repository"
    echo "   3. Push your code"
    echo "   4. Open repository in browser"
    echo "   5. Ready for Vercel deployment"
else
    echo -e "${RED}⚠️  Some checks failed. Please review above.${NC}"
fi

echo ""
echo "📁 Project structure:"
find . -maxdepth 2 -type f -name "*.json" -o -name "*.js" -o -name "*.ts" -o -name "*.md" -o -name "Dockerfile" | grep -v node_modules | sort
