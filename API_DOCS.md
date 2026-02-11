# Ticketing Mock API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
All protected endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <access_token>
```

The API uses JWT tokens with access and refresh token support. Test credentials:
- Email: `admin@example.com`
- Password: `demo123`

---

## Auth Endpoints

### POST /auth/login
Login with email and password.
```json
{
  "email": "admin@example.com",
  "password": "demo123"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin",
      "createdAt": "2026-01-01T00:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  "message": "Login successful"
}
```

### POST /auth/refresh
Refresh access token using refresh token.
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Token refreshed successfully"
}
```

### POST /auth/logout
Logout user.

### GET /auth/me
Get current user profile (requires auth).

### GET /auth/users
Get all users list (requires auth).

### GET /auth/users/:id
Get specific user by ID (requires auth).

---

## Tickets Endpoints (Master Data)

Tickets are master data representing available ticket types. They contain only basic information like price and visibility status.

### GET /tickets
Get all tickets with filters and pagination.

Query params:
- `search` - Search by ticket code
- `status` - Filter by status (visible, hidden)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "ticket-1",
      "code": "TCK-00001",
      "price": 75000,
      "status": "visible",
      "createdAt": "2026-01-10T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  },
  "message": "Tickets retrieved successfully"
}
```

### GET /tickets/:id
Get ticket by ID.

### POST /tickets
Create new ticket (requires auth).
```json
{
  "code": "TCK-00026",
  "price": 100000,
  "status": "visible"
}
```

### PUT /tickets/:id
Update ticket (requires auth). Update price and/or status.
```json
{
  "price": 100000,
  "status": "visible"
}
```

### PATCH /tickets/:id/status
Update ticket status only (requires auth).
```json
{
  "status": "hidden"
}
```

### DELETE /tickets/:id
Delete ticket (soft delete - requires auth). Sets status to hidden.

### GET /tickets/stats/summary
Get ticket statistics (no auth required).

Response:
```json
{
  "success": true,
  "data": {
    "total": 25,
    "visible": 24,
    "hidden": 1
  },
  "message": "Ticket statistics retrieved successfully"
}
```

---

## Orders Endpoints (Requires Auth)

Orders represent ticket purchases with visitor details and transaction information.

### GET /orders
Get all orders with filters and pagination (requires auth).

Query params:
- `status` - Filter by status (pending, completed, cancelled)
- `type` - Filter by ticket type (regular, vip, group)
- `paymentType` - Filter by payment type (cash, non-cash)
- `userId` - Filter by user ID
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

Response:
```json
{
  "success": true,
  "data": [
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
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 10,
    "pages": 1
  },
  "message": "Orders retrieved successfully"
}
```

### GET /orders/:id
Get order by ID (requires auth). User can only access their own orders.

### GET /orders/user/:userId
Get orders by user ID (requires auth). Supports pagination with `page` and `limit` query params.

### POST /orders
Create new order (requires auth).
```json
{
  "user_id": "2",
  "ticket_id": "ticket-1",
  "visitor_name": "John Doe",
  "visit_date": "2026-02-10T10:30:00Z",
  "qty": 2,
  "type": "regular",
  "payment_type": "cash",
  "total_amount": 150000,
  "status": "pending"
}
```

### PATCH /orders/:id/status
Update order status (requires auth). User can only update their own orders.
```json
{
  "status": "completed"
}
```

### GET /orders/stats/summary
Get order statistics (requires auth).

Response:
```json
{
  "success": true,
  "data": {
    "total": 10,
    "completed": 7,
    "pending": 2,
    "cancelled": 1,
    "totalRevenue": 1050000,
    "averageOrderValue": 150000,
    "byType": {
      "regular": 3,
      "vip": 4,
      "group": 3
    },
    "byPaymentType": {
      "cash": 5,
      "nonCash": 5
    }
  },
  "message": "Order statistics retrieved successfully"
}
```

---

## Analytics Endpoints (Requires Auth)

### GET /analytics/dashboard
Get combined ticket and order statistics.

Response:
```json
{
  "success": true,
  "data": {
    "tickets": {
      "total": 25,
      "visible": 24,
      "hidden": 1
    },
    "orders": {
      "total": 10,
      "completed": 7,
      "pending": 2,
      "cancelled": 1,
      "totalRevenue": 1050000,
      "averageOrderValue": 150000,
      "byType": {
        "regular": 3,
        "vip": 4,
        "group": 3
      },
      "byPaymentType": {
        "cash": 5,
        "nonCash": 5
      }
    },
    "summary": {
      "totalTickets": 25,
      "totalOrders": 10,
      "totalRevenue": 1050000,
      "completedOrders": 7
    }
  },
  "message": "Dashboard analytics retrieved successfully"
}
```

### GET /analytics/tickets
Get ticket statistics.

### GET /analytics/orders
Get order statistics.

### GET /analytics/revenue
Get revenue breakdown by payment type.

Response:
```json
{
  "success": true,
  "data": {
    "totalRevenue": 1050000,
    "byPaymentType": {
      "cash": 525000,
      "nonCash": 525000
    },
    "completedOrders": 7,
    "averageOrderValue": 150000
  },
  "message": "Revenue analytics retrieved successfully"
}
```

### GET /analytics/ticket-types
Get order distribution by ticket type.

Response:
```json
{
  "success": true,
  "data": {
    "regular": 3,
    "vip": 4,
    "group": 3
  },
  "message": "Ticket type distribution retrieved successfully"
}
```

### GET /analytics/ticket-status
Get order distribution by status.

Response:
```json
{
  "success": true,
  "data": {
    "completed": 7,
    "pending": 2,
    "cancelled": 1
  },
  "message": "Status distribution retrieved successfully"
}
```

---

## Reports Endpoints (Requires Auth)

### GET /reports/tickets
Get detailed ticket report with filters.

Query params:
- `status` - Filter by status (visible, hidden)
- `minPrice` - Minimum ticket price
- `maxPrice` - Maximum ticket price
- `limit` - Items per page (default: 100)
- `offset` - Pagination offset (default: 0)

### GET /reports/orders
Get detailed order report with filters.

Query params:
- `status` - Filter by status (pending, completed, cancelled)
- `type` - Filter by ticket type (regular, vip, group)
- `paymentType` - Filter by payment type (cash, non-cash)
- `userId` - Filter by user ID
- `limit` - Items per page (default: 100)
- `offset` - Pagination offset (default: 0)

### GET /reports/sales
Get sales report by date.

Query params:
- `startDate` - Start date for report
- `endDate` - End date for report
- `limit` - Items per page (default: 100)

Response:
```json
{
  "success": true,
  "data": {
    "totalSales": 7,
    "totalRevenue": 1050000,
    "salesByDate": {
      "2026-01-20": {
        "count": 1,
        "amount": 150000
      },
      "2026-01-21": {
        "count": 1,
        "amount": 75000
      }
    }
  },
  "message": "Sales report retrieved successfully"
}
```

### GET /reports/user-activity
Get user activity report.

Query params:
- `limit` - Items per page (default: 100)
- `offset` - Pagination offset (default: 0)

Response:
```json
{
  "success": true,
  "data": {
    "total": 5,
    "users": [
      {
        "userId": "2",
        "userName": "John Doe",
        "email": "john@example.com",
        "totalOrders": 3,
        "totalSpent": 325000,
        "completedOrders": 2,
        "pendingOrders": 1
      }
    ]
  },
  "message": "User activity report retrieved successfully"
}
```

### GET /reports/summary
Get complete report summary.

Response:
```json
{
  "success": true,
  "data": {
    "tickets": {
      "byStatus": {
        "visible": 24,
        "hidden": 1
      }
    },
    "orders": {
      "byStatus": {
        "completed": 7,
        "pending": 2,
        "cancelled": 1
      },
      "byType": {
        "regular": 3,
        "vip": 4,
        "group": 3
      },
      "byPaymentType": {
        "cash": 5,
        "nonCash": 5
      },
      "totalAmount": 1050000,
      "averageAmount": 150000
    },
    "overview": {
      "totalTickets": 25,
      "totalOrders": 10,
      "totalRevenue": 1050000,
      "averageOrderValue": 150000
    }
  },
  "message": "Summary report retrieved successfully"
}
```

---

## Health Check

### GET /health
Check API health status and database connectivity.

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-02-11T10:30:00Z",
    "uptime": 3600.5,
    "database": "connected",
    "version": "1.0.0",
    "environment": "development"
  },
  "message": "API is healthy"
}
```

Unhealthy response (503):
```json
{
  "success": false,
  "data": {
    "status": "unhealthy",
    "timestamp": "2026-02-11T10:30:00Z",
    "uptime": 3600.5,
    "database": "disconnected",
    "version": "1.0.0",
    "environment": "development"
  },
  "message": "API is unhealthy - database connection failed"
}
```

---

## Response Format

All responses follow this format:
```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

Error responses:
```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

---

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

### Auth Tokens
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Sample Users

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | demo123 | admin |
| john@example.com | pass123 | user |
| jane@example.com | pass123 | user |
| bob@example.com | pass123 | user |
| alice@example.com | pass123 | user |

---

## Data Files

- `data/users.json` - User data (5 sample users)
- `data/tickets.json` - Ticket master data (25 sample tickets)
- `data/orders.json` - Order transaction data (10 sample orders)
