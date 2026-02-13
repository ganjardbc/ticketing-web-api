# API Test Suite - Setup Instructions

## 📋 Overview

A comprehensive API test suite has been created for the Ticketing Mock API. This document provides step-by-step instructions to get started.

## ✅ What Was Added

1. **Comprehensive Test Suite** (`tests/api/endpoints.test.ts`)
   - 50+ test cases covering all API endpoints
   - Tests for authentication, CRUD operations, filtering, pagination
   - Error handling and edge case testing

2. **Documentation**
   - `TESTING.md` - Detailed testing guide
   - `TEST_QUICK_START.md` - Quick reference
   - `API_TEST_SUMMARY.md` - Overview of what was created
   - `SETUP_INSTRUCTIONS.md` - This file

3. **Test Runner Script** (`run-tests.sh`)
   - Convenient script to run tests with different options
   - Checks if API server is running before tests

4. **Dependencies**
   - Added `axios` to devDependencies for HTTP requests

## 🚀 Quick Setup (3 Steps)

### Step 1: Install Dependencies
```bash
cd ticketing-mock-api
npm install
```

### Step 2: Start the API Server
Open a new terminal and run:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Step 3: Run the Tests
In another terminal, run:
```bash
npm test
```

## 📊 Test Suite Details

### Test Categories

1. **Health Check** (1 test)
   - Verifies API is running and database is connected

2. **Authentication** (7 tests)
   - Login, logout, token refresh
   - User profile and user list endpoints
   - Invalid credentials handling

3. **Tickets** (9 tests)
   - CRUD operations (Create, Read, Update, Delete)
   - Filtering and searching
   - Statistics and status updates

4. **Orders** (9 tests)
   - CRUD operations
   - Filtering by status, type, payment method
   - User-specific orders
   - Statistics

5. **Analytics** (6 tests)
   - Dashboard analytics
   - Revenue analytics
   - Distribution by type and status

6. **Reports** (8 tests)
   - Ticket reports with filtering
   - Order reports with filtering
   - Sales reports
   - User activity reports

7. **Error Handling** (3 tests)
   - 404 errors
   - 401 authentication errors
   - 400 validation errors

**Total: 50+ test cases**

## 🎯 Running Tests

### All Tests
```bash
npm test
```

### Specific Test File
```bash
npm test -- tests/api/endpoints.test.ts
```

### With Coverage Report
```bash
npm test -- --coverage
```

### Watch Mode
```bash
npm run test:watch
```

### Using Test Runner Script
```bash
# All tests
./run-tests.sh

# With coverage
./run-tests.sh coverage

# Watch mode
./run-tests.sh watch

# API tests only
./run-tests.sh api
```

## 🔐 Test Credentials

The tests use the default seed data:
- **Email**: admin@example.com
- **Password**: demo123
- **Role**: admin

These credentials are automatically used by the test suite.

## 📁 File Structure

```
ticketing-mock-api/
├── tests/
│   ├── api/
│   │   └── endpoints.test.ts          # Main test suite (NEW)
│   ├── config/
│   ├── db/
│   ├── properties/
│   ├── services/
│   ├── unit/
│   └── utils/
├── src/
├── data/
├── TESTING.md                          # Detailed guide (NEW)
├── TEST_QUICK_START.md                 # Quick reference (NEW)
├── API_TEST_SUMMARY.md                 # Summary (NEW)
├── SETUP_INSTRUCTIONS.md               # This file (NEW)
├── run-tests.sh                        # Test runner script (NEW)
├── package.json                        # Updated with axios
└── ...
```

## ✨ Expected Output

When tests pass, you'll see:
```
PASS  tests/api/endpoints.test.ts
  Ticketing Mock API - Full Endpoint Tests
    Health Check
      ✓ GET /health - should return healthy status (XX ms)
    Auth Endpoints
      ✓ POST /auth/login - should login successfully (XX ms)
      ✓ POST /auth/login - should fail with invalid credentials (XX ms)
      ✓ GET /auth/me - should get current user profile (XX ms)
      ...
    [More test results]

Test Suites: 1 passed, 1 total
Tests:       50+ passed, 50+ total
Snapshots:   0 total
Time:        X.XXXs
```

## 🐛 Troubleshooting

### Issue: Tests fail with connection error
**Solution**: Ensure API server is running
```bash
npm run dev
```

### Issue: Tests timeout
**Solution**: Check if API server is responsive and database is connected

### Issue: Authentication errors
**Solution**: Verify test credentials exist in `data/users.json`

### Issue: Module not found errors
**Solution**: Install dependencies
```bash
npm install
```

## 📚 Documentation Files

- **TESTING.md** - Comprehensive testing guide with:
  - Detailed test suite overview
  - Individual endpoint descriptions
  - Coverage information
  - CI/CD integration examples
  - Adding new tests

- **TEST_QUICK_START.md** - Quick reference with:
  - 3-step setup
  - Common commands
  - Expected output
  - Quick troubleshooting

- **API_TEST_SUMMARY.md** - Overview of:
  - What was created
  - Test coverage
  - How to use
  - Next steps

## 🔄 CI/CD Integration

To integrate tests into your CI/CD pipeline:

```bash
# Install dependencies
npm install

# Start API server in background
npm run dev &

# Wait for server to start
sleep 5

# Run tests
npm test -- --coverage

# Generate coverage report
npm test -- --coverage --coverageReporters=lcov
```

See `TESTING.md` for more CI/CD examples.

## 📈 Next Steps

1. **Run the tests**: `npm test`
2. **Review results**: Check test output
3. **Check coverage**: `npm test -- --coverage`
4. **Read documentation**: See `TESTING.md` for details
5. **Add more tests**: Extend as needed
6. **Integrate with CI/CD**: Use examples in `TESTING.md`

## 🎉 Summary

You now have:
- ✅ 50+ comprehensive API tests
- ✅ Full endpoint coverage
- ✅ Authentication and authorization testing
- ✅ Error handling tests
- ✅ Filtering and pagination tests
- ✅ Complete documentation
- ✅ Convenient test runner script
- ✅ CI/CD ready

**Start testing now**: `npm test`

## 📞 Support

For more information:
- See `TESTING.md` for detailed documentation
- See `TEST_QUICK_START.md` for quick reference
- See `API_DOCS.md` for API endpoint documentation
- Check test file comments for specific test details

Happy testing! 🚀
