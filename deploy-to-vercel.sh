#!/bin/bash

echo "🚀 Deploying Weather Dashboard to Vercel"
echo "========================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel
echo "🔐 Please login to Vercel..."
vercel login

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
echo ""
echo "🌐 Your Weather Dashboard is now live!"
echo "📊 Check the Vercel dashboard for your live URL"
echo "🔍 Test the health endpoint: YOUR_URL/api/health"
