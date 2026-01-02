#!/bin/bash

# Quick Test Script for Laravel Session SDK

echo "🧪 Laravel Session SDK - Quick Local Test"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from laravel-session-sdk directory"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 2: Building TypeScript...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

echo -e "${YELLOW}Step 3: Verifying build output...${NC}"
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ dist/ directory not found${NC}"
    exit 1
fi

if [ ! -f "dist/index.js" ]; then
    echo -e "${RED}❌ dist/index.js not found${NC}"
    exit 1
fi

if [ ! -f "dist/index.d.ts" ]; then
    echo -e "${RED}❌ dist/index.d.ts not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build output verified${NC}"
echo ""

echo -e "${YELLOW}Step 4: Creating npm link...${NC}"
npm link
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm link failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm link created${NC}"
echo ""

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ SDK is ready for local testing!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Create a test Next.js project:"
echo "   npx create-next-app@latest test-app --typescript"
echo ""
echo "2. Link the SDK in your test project:"
echo "   cd test-app"
echo "   npm link @yourorg/laravel-session-sdk"
echo "   npm install mysql2"
echo ""
echo "3. Follow the examples in LOCAL_TESTING_GUIDE.md"
echo ""
echo "To unlink later:"
echo "   npm unlink @yourorg/laravel-session-sdk"
echo ""

