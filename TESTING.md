# API Testing Guide

This document explains how to run the comprehensive API test suite for the Ticketing Mock API.

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Ensure the API server is running:
```bash
npm run dev
```

The server should be running on `http://localhost:3000` before running tests.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run specific test file
```bash
npm test -- tests/api/endpoints.test.ts
```

### Run tests with coverage
```bash
npm test -- --coverage
```

## Test Suite Overview

The comprehensive API test suite (`tests/api/endpoints.test.ts`) covers all endpoints documented in `API_DOCS.md`:

### 1. Health Check
- `GET /health` - Verify API health and database connectivity

### 2. Auth Endpoints
- `POST /auth/login` - Login with credentials
- `POST /auth/login` - Verify invalid credentials handling
- `GET /auth/me` - Get current user profile
- `GET /auth/users` - Get all users
- `GET /auth/users/:id` - Get specific user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user

### 3. Tickets Endpoints
- `GET /tickets` - Get all tickets with pagination
- `GET /tickets` - Filter by status
- `GET /tickets` - Search by code
- `GET /tickets/:id` - Get specific ticket
- `POST /tickets` - Create new ticket
- `PUT /tickets/:id` - Update ticket
- `PATCH /tickets/:id/status` - Update ticket status
- `GET /tickets/stats/summary` - Get ticket statistics
- `DELETE /tickets/:id` - Delete ticket (soft delete)

### 4. Orders Endpoints
- `GET /orders` - Get all orders with pagination
- `GET /orders` - Filter by status
- `GET /orders` - Filter by type
- `GET /orders` - Filter by payment type
- `POST /orders` - Create new order
- `GET /orders/:id` - Get specific order
- `GET /orders/user/:userId` - Get orders by user
- `PATCH /orders/:id/status` - Update order status
- `GET /orders/stats/summary` - Get order statistics

### 5. Analytics Endpoints
- `GET /analytics/dashboard` - Get dashboard analytics
- `GET /analytics/tickets` - Get ticket analytics
- `GET /analytics/orders` - Get order analytics
- `GET /analytics/revenue` - Get revenue analytics
- `GET /analytics/ticket-types` - Get ticket type distribution
- `GET /analytics/ticket-status` - Get ticket status distribution

### 6. Reports Endpoints
- `GET /reports/tickets` - Get ticket report
- `GET /reports/tickets` - Filter by status
- `GET /reports/tickets` - Filter by price range
- `GET /reports/orders` - Get order report
- `GET /reports/orders` - Filter by status
- `GET /reports/sales` - Get sales report
- `GET /reports/user-activity` - Get user activity report
- `GET /reports/summary` - Get report summary

### 7. Error Handling
- Non-existent endpoints (404)
- Missing authentication (401)
- Invalid request body (400)

## Test Credentials

The tests use the following credentials for authentication:
- Email: `admin@example.com`
- Password: `demo123`

These credentials are defined in the API seed data and can be found in `data/users.json`.

## Test Flow

The test suite follows this flow:

1. **Health Check** - Verify API is running
2. **Authentication** - Login and get tokens
3. **Tickets** - Test all ticket operations
4. **Orders** - Test all order operations
5. **Analytics** - Test analytics endpoints
6. **Reports** - Test reporting endpoints
7. **Error Handling** - Verify error responses

## Expected Results

All tests should pass with the following expectations:

- ✅ Health check returns 200 with healthy status
- ✅ Login returns 200 with valid tokens
- ✅ All CRUD operations return appropriate status codes
- ✅ Filtering and pagination work correctly
- ✅ Authentication is enforced on protected endpoints
- ✅ Error responses have correct status codes

## Troubleshooting

### Tests fail with connection errors
- Ensure the API server is running: `npm run dev`
- Check that the server is listening on `http://localhost:3000`
- Verify no other process is using port 3000

### Tests fail with authentication errors
- Verify the test credentials exist in `data/users.json`
- Check that the JWT secret is configured in `.env`
- Ensure the database is initialized with seed data

### Tests timeout
- Increase Jest timeout: `jest.setTimeout(10000)`
- Check API server performance
- Verify database connectivity

## Coverage

The test suite aims for comprehensive coverage of:
- All API endpoints
- Happy path scenarios
- Error handling
- Authentication and authorization
- Filtering and pagination
- Data validation

## Continuous Integration

To run tests in CI/CD pipeline:

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

## Adding New Tests

When adding new endpoints:

1. Add test cases to `tests/api/endpoints.test.ts`
2. Follow the existing test structure
3. Use descriptive test names
4. Include both success and error cases
5. Run tests to verify: `npm test`

## Performance Testing

For performance testing, consider:

1. Load testing with multiple concurrent requests
2. Response time benchmarks
3. Database query optimization
4. Caching effectiveness

These can be added as separate test suites in the future.
