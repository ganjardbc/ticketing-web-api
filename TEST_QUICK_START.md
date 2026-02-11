# Quick Start - API Testing

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the API Server
Open a terminal and run:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Step 3: Run the Tests
In another terminal, run:
```bash
npm test
```

Or use the test runner script:
```bash
./run-tests.sh
```

## 📋 Test Options

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npm test -- tests/api/endpoints.test.ts
```

### Run with coverage report
```bash
npm test -- --coverage
```

### Run in watch mode
```bash
npm run test:watch
```

### Using the test runner script
```bash
# Run all tests
./run-tests.sh all

# Run in watch mode
./run-tests.sh watch

# Run with coverage
./run-tests.sh coverage

# Run only API tests
./run-tests.sh api
```

## 📊 What Gets Tested

The comprehensive test suite covers:

✅ **Health Check** - API status and database connectivity
✅ **Authentication** - Login, logout, token refresh
✅ **Tickets** - CRUD operations, filtering, statistics
✅ **Orders** - CRUD operations, filtering, statistics
✅ **Analytics** - Dashboard, revenue, ticket types
✅ **Reports** - Tickets, orders, sales, user activity
✅ **Error Handling** - 404, 401, 400 responses

## 🔐 Test Credentials

The tests automatically use:
- Email: `admin@example.com`
- Password: `demo123`

## 📁 Test Files

- `tests/api/endpoints.test.ts` - Comprehensive API endpoint tests
- `TESTING.md` - Detailed testing documentation
- `run-tests.sh` - Test runner script

## ✨ Expected Output

When all tests pass, you'll see:
```
PASS  tests/api/endpoints.test.ts
  Ticketing Mock API - Full Endpoint Tests
    Health Check
      ✓ GET /health - should return healthy status
    Auth Endpoints
      ✓ POST /auth/login - should login successfully
      ✓ POST /auth/login - should fail with invalid credentials
      ...
    [More test results]

Test Suites: 1 passed, 1 total
Tests:       50+ passed, 50+ total
```

## 🐛 Troubleshooting

**Tests fail with connection error?**
- Make sure the API server is running: `npm run dev`
- Check that it's on `http://localhost:3000`

**Tests timeout?**
- Ensure the API server is responsive
- Check database connectivity
- Try increasing Jest timeout

**Authentication errors?**
- Verify test credentials in `data/users.json`
- Check `.env` file has JWT_SECRET configured

## 📚 More Information

See `TESTING.md` for detailed documentation on:
- Test suite overview
- Individual endpoint tests
- Coverage information
- CI/CD integration
- Adding new tests

## 🎯 Next Steps

1. Run the tests: `npm test`
2. Review test results
3. Check coverage: `npm test -- --coverage`
4. Add more tests as needed
5. Integrate into CI/CD pipeline

Happy testing! 🎉
