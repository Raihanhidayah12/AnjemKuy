#!/bin/bash

# ============================================================
# Anjem Kuy - Quick Deploy Script
# ============================================================

echo "🏍️  Anjem Kuy - Deploy Script"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${YELLOW}Git not initialized. Initializing...${NC}"
    git init
    echo -e "${GREEN}✓ Git initialized${NC}"
fi

# Check if remote exists
if ! git remote | grep -q 'origin'; then
    echo -e "${RED}✗ No git remote 'origin' found!${NC}"
    echo "Please add your repository:"
    echo "  git remote add origin https://github.com/username/anjemkuy.git"
    exit 1
fi

echo -e "${YELLOW}Building project...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Git operations
echo -e "${YELLOW}Preparing commit...${NC}"
git add .

echo "Enter commit message (or press Enter for default):"
read commit_message

if [ -z "$commit_message" ]; then
    commit_message="Deploy: $(date +'%Y-%m-%d %H:%M:%S')"
fi

git commit -m "$commit_message"

echo -e "${YELLOW}Pushing to repository...${NC}"
git push origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Push failed!${NC}"
    echo "Try: git push -u origin main"
    exit 1
fi

echo -e "${GREEN}✓ Successfully pushed to GitHub${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Deployment triggered!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Check Vercel dashboard for deployment status"
echo "2. Visit your app at: https://anjemkuy.vercel.app"
echo "3. Test booking flow end-to-end"
echo ""
echo "🚀 Happy deploying!"
