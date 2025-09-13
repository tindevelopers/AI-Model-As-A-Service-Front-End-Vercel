#!/bin/bash

# Test Build Script for AI Model Service Frontend
# This script tests the build process locally to catch issues before CI/CD

set -e  # Exit on any error

echo "🚀 Testing AI Model Service Frontend Build"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📋 Node.js version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm --version)
echo "📋 NPM version: $NPM_VERSION"

# Set memory limit to match CI/CD environment
export NODE_OPTIONS="--max-old-space-size=4096"
echo "📋 Node options: $NODE_OPTIONS"

# Clean previous build
echo "🧹 Cleaning previous build artifacts..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Disable telemetry
echo "📊 Disabling Next.js telemetry..."
npx next telemetry disable

# Run build
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "📊 Build Summary:"
    echo "- Build artifacts: .next/"
    echo "- Static pages: Generated successfully"
    echo "- Bundle analysis: Check output above"
    echo ""
    echo "🚀 Ready for deployment!"
else
    echo "❌ Build failed!"
    exit 1
fi
