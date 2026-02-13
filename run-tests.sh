#!/bin/bash

# Ticketing Mock API - Test Runner Script
# This script helps run the comprehensive API test suite

set -e

echo "🧪 Ticketing Mock API - Test Suite"
echo "=================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if API server is running
echo "🔍 Checking if API server is running on http://localhost:3000..."
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "⚠️  API server is not running!"
    echo ""
    echo "Please start the API server in another terminal:"
    echo "  npm run dev"
    echo ""
    exit 1
fi

echo "✅ API server is running"
echo ""

# Parse command line arguments
TEST_TYPE=${1:-all}

case $TEST_TYPE in
    all)
        echo "🚀 Running all tests..."
        npm test
        ;;
    watch)
        echo "👀 Running tests in watch mode..."
        npm run test:watch
        ;;
    coverage)
        echo "📊 Running tests with coverage..."
        npm test -- --coverage
        ;;
    api)
        echo "🌐 Running API endpoint tests..."
        npm test -- tests/api/endpoints.test.ts
        ;;
    *)
        echo "Usage: ./run-tests.sh [all|watch|coverage|api]"
        echo ""
        echo "Options:"
        echo "  all      - Run all tests (default)"
        echo "  watch    - Run tests in watch mode"
        echo "  coverage - Run tests with coverage report"
        echo "  api      - Run only API endpoint tests"
        exit 1
        ;;
esac

echo ""
echo "✨ Test run complete!"
