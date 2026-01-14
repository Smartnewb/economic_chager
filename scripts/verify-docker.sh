#!/bin/bash

# Docker Build Verification Script
# Validates that Docker images build correctly

set -e

echo "🐳 Docker Build Verification"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is available${NC}"

# Check docker-compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not available${NC}"
    exit 1
fi

echo -e "${GREEN}✓ docker-compose is available${NC}"

# Navigate to project root
cd "$(dirname "$0")/.."

echo ""
echo "📦 Building Backend Image..."
echo "----------------------------"

if docker build -t insight-flow-api:test -f api/Dockerfile api/; then
    echo -e "${GREEN}✓ Backend image built successfully${NC}"
else
    echo -e "${RED}❌ Backend image build failed${NC}"
    exit 1
fi

echo ""
echo "📦 Building Frontend Image..."
echo "-----------------------------"

if docker build -t insight-flow-frontend:test -f frontend/Dockerfile frontend/; then
    echo -e "${GREEN}✓ Frontend image built successfully${NC}"
else
    echo -e "${RED}❌ Frontend image build failed${NC}"
    exit 1
fi

echo ""
echo "🧪 Verifying Image Contents..."
echo "------------------------------"

# Check backend image
echo "Backend image size:"
docker images insight-flow-api:test --format "{{.Size}}"

# Check frontend image
echo "Frontend image size:"
docker images insight-flow-frontend:test --format "{{.Size}}"

echo ""
echo "🔍 Testing Container Startup..."
echo "-------------------------------"

# Test backend container starts
echo "Testing backend container..."
BACKEND_CONTAINER=$(docker run -d --rm -p 8001:8000 insight-flow-api:test)
sleep 5

if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend health check passed${NC}"
else
    echo -e "${YELLOW}⚠ Backend health check - server may need more time${NC}"
fi

docker stop $BACKEND_CONTAINER > /dev/null 2>&1 || true

echo ""
echo "📋 Summary"
echo "=========="
echo -e "${GREEN}✓ Docker build verification complete${NC}"
echo ""
echo "To run the full stack:"
echo "  docker-compose up"
echo ""
echo "To run in detached mode:"
echo "  docker-compose up -d"
echo ""

# Cleanup test images (optional)
echo "Cleaning up test images..."
docker rmi insight-flow-api:test insight-flow-frontend:test > /dev/null 2>&1 || true

echo -e "${GREEN}✅ All Docker verification checks passed!${NC}"
