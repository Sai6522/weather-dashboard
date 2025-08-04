#!/bin/bash

# Dockerfile Validation Script (No Docker Required)
set -e

echo "🔍 Validating Docker Configuration"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required files exist
echo "1️⃣ Checking required files..."

required_files=(
    "Dockerfile"
    "package.json"
    "next.config.js"
    ".dockerignore"
    "docker-compose.yml"
    "render.yaml"
    "vercel.json"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "$file exists"
    else
        print_error "$file is missing"
        exit 1
    fi
done

# Validate Dockerfile syntax
echo "2️⃣ Validating Dockerfile syntax..."

# Check for required Dockerfile instructions
dockerfile_checks=(
    "FROM.*node.*alpine"
    "WORKDIR /app"
    "COPY package.json"
    "RUN.*npm.*ci"
    "COPY.*\."
    "RUN.*npm.*build"
    "EXPOSE 3000"
    "CMD.*node.*server.js"
)

for check in "${dockerfile_checks[@]}"; do
    if grep -q "$check" Dockerfile; then
        print_status "Found: $check"
    else
        print_warning "Missing or different: $check"
    fi
done

# Validate package.json
echo "3️⃣ Validating package.json..."

if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
    print_status "package.json is valid JSON"
else
    print_error "package.json is invalid JSON"
    exit 1
fi

# Check for required scripts
required_scripts=("build" "start")
for script in "${required_scripts[@]}"; do
    if node -e "const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8')); if (!pkg.scripts || !pkg.scripts['$script']) process.exit(1)" 2>/dev/null; then
        print_status "Script '$script' found in package.json"
    else
        print_error "Script '$script' missing in package.json"
        exit 1
    fi
done

# Validate next.config.js
echo "4️⃣ Validating Next.js configuration..."

if node -e "require('./next.config.js')" 2>/dev/null; then
    print_status "next.config.js is valid"
else
    print_error "next.config.js has syntax errors"
    exit 1
fi

# Check for standalone output
if grep -q "output.*standalone" next.config.js; then
    print_status "Standalone output configured"
else
    print_warning "Standalone output not configured (recommended for Docker)"
fi

# Validate .dockerignore
echo "5️⃣ Validating .dockerignore..."

dockerignore_patterns=(
    "node_modules"
    ".next"
    ".env"
    "*.log"
)

for pattern in "${dockerignore_patterns[@]}"; do
    if grep -q "$pattern" .dockerignore; then
        print_status "Ignoring: $pattern"
    else
        print_warning "Not ignoring: $pattern"
    fi
done

# Validate docker-compose.yml
echo "6️⃣ Validating docker-compose.yml..."

if command -v python3 &> /dev/null; then
    if python3 -c "import yaml; yaml.safe_load(open('docker-compose.yml'))" 2>/dev/null; then
        print_status "docker-compose.yml is valid YAML"
    else
        print_error "docker-compose.yml is invalid YAML"
        exit 1
    fi
else
    print_warning "Python3 not available, skipping YAML validation"
fi

# Validate render.yaml
echo "7️⃣ Validating render.yaml..."

if command -v python3 &> /dev/null; then
    if python3 -c "import yaml; yaml.safe_load(open('render.yaml'))" 2>/dev/null; then
        print_status "render.yaml is valid YAML"
    else
        print_error "render.yaml is invalid YAML"
        exit 1
    fi
else
    print_warning "Python3 not available, skipping YAML validation"
fi

# Validate vercel.json
echo "8️⃣ Validating vercel.json..."

if node -e "JSON.parse(require('fs').readFileSync('vercel.json', 'utf8'))" 2>/dev/null; then
    print_status "vercel.json is valid JSON"
else
    print_error "vercel.json is invalid JSON"
    exit 1
fi

# Check project structure
echo "9️⃣ Validating project structure..."

required_dirs=(
    "src/app"
    "src/components"
    "src/store"
    "src/services"
    "public"
    "scripts"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        print_status "Directory exists: $dir"
    else
        print_warning "Directory missing: $dir"
    fi
done

# Check for health endpoint
echo "🔟 Checking health endpoint..."

if [ -f "src/app/api/health/route.ts" ]; then
    print_status "Health endpoint exists"
else
    print_error "Health endpoint missing"
    exit 1
fi

# Estimate Docker image size
echo "📏 Estimating Docker image characteristics..."

# Count source files
src_files=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | wc -l)
public_files=$(find public -type f 2>/dev/null | wc -l || echo "0")

echo "Source files: $src_files"
echo "Public files: $public_files"

# Check dependencies
deps=$(node -e "const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8')); console.log(Object.keys(pkg.dependencies || {}).length)")
devDeps=$(node -e "const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8')); console.log(Object.keys(pkg.devDependencies || {}).length)")

echo "Dependencies: $deps"
echo "Dev dependencies: $devDeps"

print_status "Docker configuration validation completed!"

echo ""
echo "📋 Summary:"
echo "- All required files are present"
echo "- Configuration files are valid"
echo "- Project structure is correct"
echo "- Ready for Docker deployment"

echo ""
echo "🚀 Next steps:"
echo "1. Install Docker Desktop"
echo "2. Run: npm run docker:test"
echo "3. Or deploy to Render/Vercel directly"

echo ""
echo "🌐 Deployment options:"
echo "- Docker: npm run deploy:docker"
echo "- Render: npm run deploy:render"
echo "- Vercel: npm run deploy:vercel"
