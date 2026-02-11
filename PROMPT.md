# Ticketing System - API Specification Prompt

Use this prompt to generate frontend, mobile, or other backend projects that integrate with this mock API.

---

## Project Overview

This is a **Ticketing Recording Application** with a mock Express.js backend API. The system manages:
- **Tickets**: Master data representing available ticket types
- **Orders**: Customer ticket purchases with visitor details
- **Users**: System users with authentication
- **Analytics**: Dashboard and reporting features

---

## API Base URL
```
http://localhost:3000
```

---

## Authentication System

### Login Flow
1. User submits email and password to `POST /auth/login`
2. API returns a Bearer token in format: `mock-{timestamp}-{userId}`
3. Include token in all protected endpoints: `Authorization: Bearer {token}`

### Test Credentials
```
Email: admin@example.com
Password: demo123

Additional Users:
- john@example.com / pass123
- jane@example.com / pass123
- bob@example.com / pass123
- alice@example.com / pass123
```

### Protected Endpoints
All endpoints under `/auth/users`, `/orders`, `/analytics`, and `/reports` require authentication.

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
**Fields:**
- `id`: Unique identifier
- `code`: Ticket code (TCK-XXXXX format)
- `price`: Ticket price in currency units
- `status`: "visible" or "hidden"
- `createdAt`: ISO timestamp

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
**Fields:**
- `id`: Unique identifier
- `orderCode`: Order code (ORD-XXXXX format)
- `userId`: Reference to user who created order
- `ticketId`: Reference to ticket type
- `visitorName`: Name of ticket visitor
- `visitDate`: When visitor will use ticket
- `qty`: Quantity of tickets
- `type`: Ticket type - "regular", "vip", or "group"
- `paymentType`: "cash" or "non-cash"
- `totalAmount`: Total order amount
- `status`: "pending", "completed", or "cancelled"
- `createdAt`: Order creation timestamp
- `completedAt`: Order completion timestamp (null if not completed)

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
**Fields:**
- `id`: Unique identifier
- `email`: User email
- `name`: User full name
- `role`: "admin" or "user"
- `createdAt`: Account creation timestamp

---

## API Endpoints

### Response Format
All endpoints return consistent JSON format:
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

## Auth Endpoints

### POST /auth/login
**Description:** Authenticate user and get token
**Body:**
```json
{
  "email": "admin@example.com",
  "password": "demo123"
}
```
**Response:**
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
**Description:** Logout user
**Auth:** Not required
**Response:** Success message

### GET /auth/me
**Description:** Get current authenticated user profile
**Auth:** Required
**Response:** Current user object

### GET /auth/users
**Description:** Get all users list
**Auth:** Required
**Response:** Array of user objects

### GET /auth/users/:id
**Description:** Get specific user by ID
**Auth:** Required
**Params:** `id` - User ID
**Response:** User object

---

## Tickets Endpoints (Master Data)

### GET /tickets
**Description:** Get all tickets with filters and pagination
**Auth:** Not required
**Query Params:**
- `search` (string) - Search by ticket code
- `status` (string) - Filter by status: "visible" or "hidden"
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "tickets": [...],
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

### GET /tickets/:id
**Description:** Get ticket by ID
**Auth:** Not required
**Params:** `id` - Ticket ID
**Response:** Ticket object

### POST /tickets
**Description:** Create new ticket
**Auth:** Not required
**Body:**
```json
{
  "price": 75000
}
```
**Response:** Created ticket object

### PUT /tickets/:id
**Description:** Update ticket (price and status)
**Auth:** Not required
**Params:** `id` - Ticket ID
**Body:**
```json
{
  "price": 100000,
  "status": "visible"
}
```
**Response:** Updated ticket object

### PATCH /tickets/:id/status
**Description:** Update ticket status only
**Auth:** Not required
**Params:** `id` - Ticket ID
**Body:**
```json
{
  "status": "hidden"
}
```
**Response:** Updated ticket object

### DELETE /tickets/:id
**Description:** Hide ticket (soft delete)
**Auth:** Not required
**Params:** `id` - Ticket ID
**Response:** Updated ticket object with status "hidden"

### GET /tickets/stats/summary
**Description:** Get ticket statistics
**Auth:** Not required
**Response:**
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

## Orders Endpoints (Transaction Data)

### GET /orders
**Description:** Get all orders with filters and pagination
**Auth:** Required
**Query Params:**
- `status` (string) - Filter by status: "pending", "completed", "cancelled"
- `type` (string) - Filter by type: "regular", "vip", "group"
- `paymentType` (string) - Filter by payment: "cash", "non-cash"
- `userId` (string) - Filter by user ID
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "total": 10,
    "page": 1,
    "limit": 10
  }
}
```

### GET /orders/:id
**Description:** Get order by ID
**Auth:** Required
**Params:** `id` - Order ID
**Response:** Order object

### GET /orders/user/:userId
**Description:** Get orders by user ID
**Auth:** Required
**Params:** `userId` - User ID
**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "total": 3
  }
}
```

### POST /orders
**Description:** Create new order
**Auth:** Required
**Body:**
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
**Response:** Created order object

### PATCH /orders/:id/status
**Description:** Update order status
**Auth:** Required
**Params:** `id` - Order ID
**Body:**
```json
{
  "status": "completed"
}
```
**Response:** Updated order object

### GET /orders/stats/summary
**Description:** Get order statistics
**Auth:** Required
**Response:**
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

## Analytics Endpoints

### GET /analytics/dashboard
**Description:** Get complete dashboard analytics
**Auth:** Required
**Response:** Combined tickets and orders analytics with summary

### GET /analytics/tickets
**Description:** Get ticket statistics
**Auth:** Required
**Response:** Ticket counts by status

### GET /analytics/orders
**Description:** Get order statistics
**Auth:** Required
**Response:** Order stats with breakdown by type and payment

### GET /analytics/revenue
**Description:** Get revenue analytics
**Auth:** Required
**Response:**
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
**Description:** Get order distribution by ticket type
**Auth:** Required
**Response:**
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
**Description:** Get order distribution by status
**Auth:** Required
**Response:**
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

## Reports Endpoints

### GET /reports/tickets
**Description:** Get detailed ticket report with filters
**Auth:** Required
**Query Params:**
- `status` (string) - Filter by status: "visible", "hidden"

**Response:** Ticket list with summary statistics

### GET /reports/orders
**Description:** Get detailed order report with filters
**Auth:** Required
**Query Params:**
- `status` (string) - Filter by status
- `type` (string) - Filter by type
- `paymentType` (string) - Filter by payment type
- `userId` (string) - Filter by user ID

**Response:** Order list with summary statistics

### GET /reports/sales
**Description:** Get sales report by date
**Auth:** Required
**Response:**
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
      }
    }
  }
}
```

### GET /reports/user-activity
**Description:** Get user activity report
**Auth:** Required
**Response:**
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
**Description:** Get complete report summary
**Auth:** Required
**Response:** Comprehensive overview of tickets, orders, and revenue

---

## Health Check

### GET /health
**Description:** Check API health status
**Auth:** Not required
**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

---

## Implementation Guidelines

### For Frontend/Web Projects
1. Implement login page with email/password form
2. Store token in localStorage or sessionStorage
3. Include token in all API requests via Authorization header
4. Create pages for:
   - Dashboard (analytics overview)
   - Ticket Management (CRUD operations)
   - Order Management (create, view, update status)
   - Reports (sales, user activity, summaries)
5. Implement pagination for list views
6. Add filters for tickets and orders
7. Display real-time statistics and charts

### For Mobile Projects
1. Implement secure token storage (Keychain/Keystore)
2. Handle network errors gracefully
3. Implement offline caching where applicable
4. Create mobile-optimized UI for:
   - Login/Authentication
   - Ticket browsing and purchase
   - Order history
   - Dashboard overview
5. Add push notifications for order status changes

### For Backend Integration
1. Replace mock API with actual database
2. Implement proper authentication (JWT, OAuth)
3. Add request validation and sanitization
4. Implement proper error handling and logging
5. Add rate limiting and security headers
6. Create database migrations
7. Implement caching strategies
8. Add comprehensive API documentation

### Common Features to Implement
- **Search & Filter**: Implement across all list endpoints
- **Pagination**: Handle large datasets efficiently
- **Sorting**: Add sorting options for lists
- **Export**: Generate reports in CSV/PDF format
- **Notifications**: Real-time updates for order status
- **User Roles**: Implement role-based access control
- **Audit Logging**: Track all user actions
- **Data Validation**: Validate all inputs on client and server

---

## Error Handling

### Common HTTP Status Codes
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Error Response Format
```json
{
  "success": false,
  "data": null,
  "message": "Descriptive error message"
}
```

---

## Testing Checklist

- [ ] Authentication (login, logout, token validation)
- [ ] Ticket CRUD operations
- [ ] Order creation and status updates
- [ ] Filtering and pagination
- [ ] Analytics calculations
- [ ] Reports generation
- [ ] Error handling
- [ ] Authorization (protected endpoints)
- [ ] Data validation
- [ ] Performance under load

---

## Sample Data

The mock API includes:
- **25 Tickets**: Mix of visible/hidden with varying prices
- **10 Orders**: Various statuses, types, and payment methods
- **5 Users**: Admin and regular users with different order histories

Use this data for testing and development.

---

## Additional Resources

- API Documentation: See `API_DOCS.md`
- Installation: See `README.md` or project root
- Test Results: All 30 endpoints tested and working
- Response Time: 300-800ms artificial delay per request (for realistic testing)

---

## Notes

- All timestamps are in ISO 8601 format
- Prices are in currency units (adjust based on your currency)
- The mock API uses in-memory storage (data resets on server restart)
- For production, replace with persistent database
- CORS is enabled for all origins
- All endpoints support JSON request/response format
