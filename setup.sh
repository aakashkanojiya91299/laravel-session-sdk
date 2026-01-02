#!/bin/bash

# Laravel Session SDK - Quick Setup Script

echo "🚀 Laravel Session SDK - Setup"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""

# Build the project
echo "🔨 Building TypeScript..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Read GETTING_STARTED.md"
echo "   2. Check examples/ directory"
echo "   3. Test locally: npm link"
echo "   4. Publish to NPM: npm publish --access public"
echo ""
echo "🔗 Quick commands:"
echo "   npm run build    - Build the project"
echo "   npm run dev      - Watch mode"
echo "   npm run lint     - Lint code"
echo "   npm run format   - Format code"
echo ""
