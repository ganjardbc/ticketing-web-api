# Ticketing Mock API

A mock Express.js API server for the Ticket Recording Application. Provides endpoints for managing tickets, orders, users, analytics, and reports with built-in authentication and CORS support.

## Features

- **Authentication** - Bearer token-based auth with mock user credentials
- **Ticket Management** - Master data for ticket types with pricing and visibility control
- **Order Management** - Track ticket purchases with visitor details and payment info
- **Analytics** - Dashboard and detailed analytics on tickets, orders, and revenue
- **Reports** - Comprehensive reporting on sales, user activity, and summaries
- **CORS Enabled** - Cross-origin requests supported
- **Response Formatting** - Consistent JSON response structure across all endpoints
- **Simulated Delays** - Optional middleware for realistic API response times

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
- `DELAY_MIN` - Minimum simulated delay in ms (default: 0)
- `DELAY_MAX` - Maximum simulated delay in ms (default: 0)

### Running the Server

**Development** (with auto-reload):
```bash
npm run dev
```

**Production**:
```bash
npm start
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
Authorization: Bearer mock-{timestamp}-{userId}
```

**Test Credentials:**
- Email: `admin@example.com`
- Password: `demo123`

### Endpoints

#### Auth (`/auth`)
- `POST /auth/login` - Login with email/password
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user profile
- `GET /auth/users` - Get all users
- `GET /auth/users/:id` - Get user by ID

#### Tickets (`/tickets`) - Master Data
- `GET /tickets` - List all tickets with filters
- `GET /tickets/:id` - Get ticket by ID
- `POST /tickets` - Create new ticket
- `PUT /tickets/:id` - Update ticket
- `PATCH /tickets/:id/status` - Update ticket status
- `DELETE /tickets/:id` - Hide ticket
- `GET /tickets/stats/summary` - Get ticket statistics

#### Orders (`/orders`) - Requires Auth
- `GET /orders` - List all orders with filters
- `GET /orders/:id` - Get order by ID
- `GET /orders/user/:userId` - Get orders by user
- `POST /orders` - Create new order
- `PATCH /orders/:id/status` - Update order status
- `GET /orders/stats/summary` - Get order statistics

#### Analytics (`/analytics`) - Requires Auth
- `GET /analytics/dashboard` - Complete dashboard analytics
- `GET /analytics/tickets` - Ticket statistics
- `GET /analytics/orders` - Order statistics
- `GET /analytics/revenue` - Revenue analytics
- `GET /analytics/ticket-types` - Orders by ticket type
- `GET /analytics/ticket-status` - Orders by status

#### Reports (`/reports`) - Requires Auth
- `GET /reports/tickets` - Detailed ticket report
- `GET /reports/orders` - Detailed order report
- `GET /reports/sales` - Sales report by date
- `GET /reports/user-activity` - User activity report
- `GET /reports/summary` - Complete report summary

#### Health
- `GET /health` - API health check

## Data Models

### Ticket (Master Data)
```json
{
  "id": "ticket-1",
  "code": "TCK-00001",
  "price": 75000,
  "status": "visible",
  "createdAt": "2026-01-10T08:00:00Z"
}
```

### Order (Transaction Data)
```json
{
  "id": "order-1",
  "orderCode": "ORD-00001",
  "userId": "2",
  "ticketId": "ticket-1",
  "visitorName": "John Doe",
  "visitDate": "2026-02-10T10:30:00Z",
  "qty": 2,
  "type": "regular",
  "paymentType": "cash",
  "totalAmount": 150000,
  "status": "completed",
  "createdAt": "2026-01-20T10:30:00Z",
  "completedAt": "2026-01-20T10:35:00Z"
}
```

### User
```json
{
  "id": "1",
  "email": "admin@example.com",
  "name": "Admin User",
  "role": "admin",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

## Sample Data

The API comes with pre-loaded sample data:

- **Users** - 5 sample users (data/users.json)
- **Tickets** - 25 sample ticket types (data/tickets.json)
- **Orders** - 10 sample orders (data/orders.json)

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
  "message": "Optional message"
}
```

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "message": "Error description"
}
```

## Project Structure

```
ticketing-mock-api/
├── server.js                 # Main server entry point
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables
├── .env.example              # Environment template
├── data/                     # Sample data files
│   ├── users.json
│   ├── tickets.json
│   └── orders.json
└── src/
    ├── db/
    │   └── database.js       # Database initialization
    ├── middleware/
    │   ├── auth.js           # Authentication middleware
    │   └── delay.js          # Simulated delay middleware
    ├── routes/               # API route handlers
    │   ├── auth.js
    │   ├── tickets.js
    │   ├── orders.js
    │   ├── analytics.js
    │   └── reports.js
    └── utils/
        └── response.js       # Response formatting utility
```

## Dependencies

- **express** - Web framework
- **cors** - Cross-origin resource sharing
- **nodemon** - Development auto-reload (dev only)

## Documentation

For detailed API documentation, see [API_DOCS.md](./API_DOCS.md)

## License

ISC
