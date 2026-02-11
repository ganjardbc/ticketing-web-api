# Ticketing Mock API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
All protected endpoints require Bearer token in Authorization header:
```
Authorization: Bearer mock-{timestamp}-{userId}
```

Test credentials:
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
    "token": "mock-1707123456789-1",
    "user": {
      "id": "1",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin"
    }
  }
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
  "data": {
    "tickets": [
      {
        "id": "ticket-1",
        "code": "TCK-00001",
        "price": 75000,
        "status": "visible",
        "createdAt": "2026-01-10T08:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

### GET /tickets/:id
Get ticket by ID.

### POST /tickets
Create new ticket.
```json
{
  "price": 75000
}
```

### PUT /tickets/:id
Update ticket (price and status).
```json
{
  "price": 100000,
  "status": "visible"
}
```

### PATCH /tickets/:id/status
Update ticket status only.
```json
{
  "status": "hidden"
}
```

### DELETE /tickets/:id
Hide ticket (sets status to hidden).

### GET /tickets/stats/summary
Get ticket statistics.

Response:
```json
{
  "success": true,
  "data": {
    "total": 25,
    "visible": 24,
    "hidden": 1
  }
}
```

---

## Orders Endpoints (Requires Auth)

Orders represent ticket purchases with visitor details and transaction information.

### GET /orders
Get all orders with filters and pagination.

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
  "data": {
    "orders": [
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
    "total": 10,
    "page": 1,
    "limit": 10
  }
}
```

### GET /orders/:id
Get order by ID.

### GET /orders/user/:userId
Get orders by user ID.

### POST /orders
Create new order.
```json
{
  "userId": "2",
  "ticketId": "ticket-1",
  "visitorName": "John Doe",
  "visitDate": "2026-02-10T10:30:00Z",
  "qty": 2,
  "type": "regular",
  "paymentType": "cash",
  "totalAmount": 150000
}
```

### PATCH /orders/:id/status
Update order status.
```json
{
  "status": "completed"
}
```

### GET /orders/stats/summary
Get order statistics.

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
  }
}
```

---

## Analytics Endpoints (Requires Auth)

### GET /analytics/dashboard
Get complete dashboard analytics combining tickets and orders.

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
      "byType": {...},
      "byPaymentType": {...}
    },
    "summary": {
      "totalTickets": 25,
      "totalOrders": 10,
      "totalRevenue": 1050000,
      "completedOrders": 7
    }
  }
}
```

### GET /analytics/tickets
Get ticket statistics.

### GET /analytics/orders
Get order statistics.

### GET /analytics/revenue
Get revenue analytics by payment type.

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
  }
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
  }
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
  }
}
```

---

## Reports Endpoints (Requires Auth)

### GET /reports/tickets
Get detailed ticket report with filters.

Query params:
- `status` - Filter by status (visible, hidden)

Response includes ticket list and summary statistics.

### GET /reports/orders
Get detailed order report with filters.

Query params:
- `status` - Filter by status (pending, completed, cancelled)
- `type` - Filter by ticket type (regular, vip, group)
- `paymentType` - Filter by payment type (cash, non-cash)
- `userId` - Filter by user ID

Response includes order list and summary statistics.

### GET /reports/sales
Get sales report by date.

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
  }
}
```

### GET /reports/user-activity
Get user activity report.

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
  }
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
  }
}
```

---

## Health Check

### GET /health
Check API health status.

Response:
```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

---

## Response Format

All responses follow this format:
```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

Error responses:
```json
{
  "success": false,
  "data": null,
  "message": "Error description"
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
