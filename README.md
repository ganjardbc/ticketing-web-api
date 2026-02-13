# Ticketing Mock API

A mock Express.js API server for the Ticket Recording Application. Provides endpoints for managing tickets, orders, users, analytics, and reports with JWT-based authentication, token blacklisting, and comprehensive error handling.

## Features

- **JWT Authentication** - Secure Bearer token-based authentication with token validation and blacklisting
- **Token Blacklist** - Logout functionality with token revocation
- **Ticket Management** - Public catalog of ticket types with pricing and visibility control
- **Order Management** - Authenticated access to track ticket purchases with visitor details and payment info
- **Analytics** - Authenticated dashboard and detailed analytics on tickets, orders, and revenue
- **Reports** - Authenticated comprehensive reporting on sales, user activity, and summaries
- **CORS Enabled** - Cross-origin requests supported
- **Rate Limiting** - Request rate limiting per IP address
- **Security Headers** - Security headers for protection against common vulnerabilities
- **Consistent Error Handling** - Standardized error responses with proper HTTP status codes
- **Request Logging** - All requests logged for debugging and monitoring

## Quick Start

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure the following variables:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `DB_HOST` - Database host
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRY` - JWT token expiry time
- `CORS_ORIGINS` - Allowed CORS origins

### Running the Server

**Development** (with auto-reload):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

**Run Tests**:
```bash
npm test
```

The server will start on `http://localhost:3000`

## API Overview

### Base URL
```
http://localhost:3000
```

### Authentication

Protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

**Login to get tokens:**
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "demo123"
}
```

Response includes `accessToken` and `refreshToken`.

### Endpoints

#### Auth (`/auth`) - Public
- `POST /auth/login` - Login with email/password, returns access and refresh tokens
- `POST /auth/logout` - Logout user (requires auth, blacklists token)
- `POST /auth/refresh` - Refresh access token using refresh token
- `GET /auth/me` - Get current user profile (requires auth)
- `GET /auth/users` - Get all users (requires auth)
- `GET /auth/users/:id` - Get user by ID (requires auth)

#### Tickets (`/tickets`) - Authenticated
All endpoints require authentication.
- `GET /tickets` - List all tickets with pagination and filters
- `GET /tickets/:id` - Get ticket by ID
- `GET /tickets/stats/summary` - Get ticket statistics
- `POST /tickets` - Create new ticket
- `PUT /tickets/:id` - Update ticket
- `PATCH /tickets/:id/status` - Update ticket status
- `DELETE /tickets/:id` - Soft delete ticket

#### Orders (`/orders`) - Authenticated
All endpoints require authentication.
- `GET /orders` - List all orders with pagination and filters
- `GET /orders/:id` - Get order by ID
- `GET /orders/user/:userId` - Get orders by user ID
- `GET /orders/stats/summary` - Get order statistics
- `POST /orders` - Create new order
- `PATCH /orders/:id/status` - Update order status

#### Analytics (`/analytics`) - Authenticated
All endpoints require authentication.
- `GET /analytics/dashboard` - Complete dashboard analytics
- `GET /analytics/tickets` - Ticket statistics
- `GET /analytics/orders` - Order statistics
- `GET /analytics/revenue` - Revenue analytics by payment type
- `GET /analytics/ticket-types` - Orders distribution by ticket type
- `GET /analytics/ticket-status` - Orders distribution by status

#### Reports (`/reports`) - Authenticated
All endpoints require authentication.
- `GET /reports/tickets` - Detailed ticket report with filters
- `GET /reports/orders` - Detailed order report with filters
- `GET /reports/sales` - Sales report by date range
- `GET /reports/user-activity` - User activity report
- `GET /reports/summary` - Complete report summary

#### Health (`/health`) - Public
- `GET /health` - API health check

## Data Models

### User
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "admin|user",
  "created_at": "2026-01-01T00:00:00Z"
}
```

### Ticket
```json
{
  "id": "uuid",
  "code": "TCK-00001",
  "price": 75000,
  "status": "visible|hidden",
  "created_at": "2026-01-10T08:00:00Z",
  "updated_at": "2026-01-10T08:00:00Z",
  "deleted_at": null
}
```

### Order
```json
{
  "id": "uuid",
  "order_code": "ORD-1234567890-ABC123",
  "user_id": "uuid",
  "ticket_id": "uuid",
  "visitor_name": "John Doe",
  "visit_date": "2026-02-10T10:30:00Z",
  "qty": 2,
  "type": "regular|vip|group",
  "payment_type": "cash|non-cash",
  "total_amount": 150000,
  "status": "pending|completed|cancelled",
  "created_at": "2026-01-20T10:30:00Z",
  "updated_at": "2026-01-20T10:30:00Z",
  "completed_at": null,
  "deleted_at": null
}
```

## Sample Data

The API comes with pre-loaded sample data:

- **Users** - 5 sample users
- **Tickets** - 25 sample ticket types
- **Orders** - 10 sample orders

### Sample Users

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | demo123 | admin |
| john@example.com | pass123 | user |
| jane@example.com | pass123 | user |
| bob@example.com | pass123 | user |
| alice@example.com | pass123 | user |

## Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field error message"
    }
  ]
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  },
  "message": "Success message"
}
```

## HTTP Status Codes

- `200 OK` - Successful GET, PUT, PATCH request
- `201 Created` - Successful POST request
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `422 Unprocessable Entity` - Business rule violation
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Database or service unavailable

## Project Structure

```
ticketing-mock-api/
├── server.js                 # Main server entry point
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── jest.config.js            # Jest test configuration
├── .env                      # Environment variables
├── .env.example              # Environment template
├── data/                     # Sample data files
│   ├── users.json
│   ├── tickets.json
│   └── orders.json
├── logs/                     # Application logs
│   ├── info.log
│   ├── warn.log
│   └── error.log
├── coverage/                 # Test coverage reports
└── src/
    ├── config/
    │   └── environment.ts    # Environment configuration
    ├── db/
    │   ├── connection.ts     # Database connection pool
    │   ├── init.ts           # Database initialization
    │   ├── migrator.ts       # Database migrations
    │   ├── seeder.ts         # Database seeding
    │   └── migrations/       # Migration files
    ├── middleware/
    │   ├── jwtAuth.ts        # JWT authentication
    │   ├── errorHandler.ts   # Error handling
    │   ├── cors.ts           # CORS configuration
    │   ├── rateLimiter.ts    # Rate limiting
    │   ├── requestLogger.ts  # Request logging
    │   └── securityHeaders.ts # Security headers
    ├── repositories/         # Data access layer
    │   ├── UserRepository.ts
    │   ├── TicketRepository.ts
    │   ├── OrderRepository.ts
    │   └── TokenBlacklistRepository.ts
    ├── services/             # Business logic layer
    │   ├── AuthService.ts
    │   ├── TicketService.ts
    │   ├── OrderService.ts
    │   ├── AnalyticsService.ts
    │   ├── ReportsService.ts
    │   └── ValidationService.ts
    ├── routes/               # API route handlers
    │   ├── auth.ts
    │   ├── tickets.ts
    │   ├── orders.ts
    │   ├── analytics.ts
    │   ├── reports.ts
    │   └── health.ts
    ├── utils/
    │   ├── logger.ts         # Logging utility
    │   └── response.ts       # Response formatting
    └── server.ts             # Express app setup
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Documentation

For detailed API documentation, see [API_DOCS.md](./API_DOCS.md)

For testing guide, see [TESTING.md](./TESTING.md)

## License

ISC
