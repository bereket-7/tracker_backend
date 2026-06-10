# Task Tracker Backend API

Production-ready Express.js REST API for the Task Tracker application with MongoDB.

## Features

- ✅ User authentication (JWT with refresh tokens)
- ✅ Task CRUD operations with soft delete
- ✅ Subtask management
- ✅ Task filtering, sorting & pagination
- ✅ Full-text search
- ✅ Dashboard statistics
- ✅ Input validation & sanitization
- ✅ Comprehensive error handling
- ✅ Security middleware (Helmet, CORS, Rate limiting, XSS protection)
- ✅ Request logging with Winston
- ✅ API versioning (v1)
- ✅ Unit & integration tests
- ✅ MongoDB indexes for performance
- ✅ Response time tracking

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (Access + Refresh tokens)
- **Validation:** express-validator
- **Security:** Helmet, CORS, bcryptjs, express-rate-limit, xss-clean, express-mongo-sanitize
- **Logging:** Winston with daily rotate
- **Testing:** Jest with Supertest
- **API Version:** v1

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task-tracker
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRE=7d
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

5. Start MongoDB (make sure MongoDB is running)

6. Run the server:
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## API Endpoints

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user (revoke refresh token)
- `GET /api/v1/auth/me` - Get current user (protected)

### Tasks
- `GET /api/v1/tasks` - Get all tasks (with filters & pagination)
- `GET /api/v1/tasks/:id` - Get single task
- `POST /api/v1/tasks` - Create new task
- `PUT /api/v1/tasks/:id` - Update task
- `PATCH /api/v1/tasks/:id/complete` - Toggle task completion
- `DELETE /api/v1/tasks/:id` - Delete task (soft delete)
- `DELETE /api/v1/tasks` - Clear all tasks (requires confirmation)

### Subtasks
- `POST /api/v1/tasks/:id/subtasks` - Add subtask
- `PUT /api/v1/tasks/:taskId/subtasks/:subtaskId` - Update subtask
- `PATCH /api/v1/tasks/:taskId/subtasks/:subtaskId/complete` - Toggle subtask
- `DELETE /api/v1/tasks/:taskId/subtasks/:subtaskId` - Delete subtask

### Dashboard
- `GET /api/v1/dashboard/stats` - Get task statistics

**Note:** Legacy routes without `/v1` are also supported for backward compatibility.

## Query Parameters for GET /api/v1/tasks

- `completed` - Filter by completion status (true/false)
- `priority` - Filter by priority (0=low, 1=medium, 2=high, 3=urgent)
- `category` - Filter by category
- `search` - Full-text search in title and description
- `sortBy` - Sort by field (dueDate, priority, createdAt)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Examples:**
```
GET /api/v1/tasks?completed=false&priority=3&sortBy=dueDate
GET /api/v1/tasks?search=important&page=2&limit=10
GET /api/v1/tasks?category=Work&sortBy=priority
```

## Request Examples

### Register User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Refresh Token
```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbG..."
}
```

### Create Task
```bash
POST /api/v1/tasks
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "title": "Complete project",
  "description": "Finish the task tracker app",
  "priority": 2,
  "category": "Work",
  "dueDate": "2024-12-31T23:59:59.000Z",
  "subtasks": [
    { "title": "Design UI", "isCompleted": false },
    { "title": "Implement backend", "isCompleted": false }
  ]
}
```

### Update Task
```bash
PUT /api/v1/tasks/:id
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "title": "Updated title",
  "isCompleted": true
}
```

### Clear All Tasks (requires confirmation)
```bash
DELETE /api/v1/tasks
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "confirmation": "DELETE_ALL"
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": { }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Error details"]
}
```

## Data Models

### User
- name (String, required, max: 50 chars)
- email (String, required, unique, indexed)
- password (String, required, hashed with bcrypt)
- refreshToken (String, stored securely)
- isActive (Boolean, default: true)
- lastLogin (Date)

### Task
- userId (ObjectId, required, indexed)
- title (String, required, max: 200 chars)
- description (String, max: 2000 chars)
- isCompleted (Boolean, default: false, indexed)
- completedAt (Date)
- dueDate (Date, indexed)
- priority (Number: 0-3, indexed)
- category (String, default: "Personal", indexed)
- subtasks (Array of SubTask)
- isDeleted (Boolean, soft delete)
- deletedAt (Date)

### SubTask
- title (String, required, max: 200 chars)
- isCompleted (Boolean, default: false)

### RefreshToken
- token (String, required, unique, indexed)
- userId (ObjectId, required, indexed)
- expiresAt (Date, indexed with TTL)
- isRevoked (Boolean, default: false)

## Security Features

- **Authentication:** JWT with access and refresh tokens
- **Password Security:** Bcrypt hashing with configurable salt rounds
- **Rate Limiting:** 
  - Global: 100 requests per 15 minutes per IP
  - Auth endpoints: 5 attempts per 15 minutes
  - User-based: 200 requests per 15 minutes per user
- **Security Headers:** Helmet.js protection
- **CORS:** Configurable whitelisted origins
- **Input Validation:** express-validator with comprehensive rules
- **Data Sanitization:** 
  - NoSQL injection protection (express-mongo-sanitize)
  - XSS protection (xss-clean)
- **Request Size Limiting:** Configurable max payload size
- **Soft Delete:** Tasks are soft-deleted for data recovery
- **Error Messages:** Generic messages to prevent information leakage
- **Token Types:** Access and refresh tokens with different purposes
- **MongoDB Indexes:** Optimized queries with compound indexes
- **Full-Text Search:** MongoDB text index for efficient searching

## Project Structure

```
task-tracker-backend/
├── src/
│   ├── __tests__/           # Test files
│   │   ├── integration/     # Integration tests
│   │   ├── unit/            # Unit tests
│   │   └── setup.js         # Test configuration
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB connection
│   │   ├── env.js           # Environment variables
│   │   └── logger.js        # Winston logger setup
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Custom middleware
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── validation.middleware.js
│   │   └── rateLimit.middleware.js
│   ├── models/              # Mongoose models
│   │   ├── User.js
│   │   ├── Task.js
│   │   └── RefreshToken.js
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── utils/               # Utility functions
│   └── app.js               # Express app setup
├── logs/                    # Log files (auto-generated)
├── .env.example             # Environment variables template
├── .gitignore
├── jest.config.js           # Jest configuration
├── package.json
├── README.md
└── server.js                # Server entry point
```

## Performance Optimizations

- **MongoDB Indexes:** Compound indexes for common query patterns
- **Connection Pooling:** Configured MongoDB connection pool
- **Response Compression:** Gzip compression for responses > 1KB
- **Query Pagination:** Default limit of 20 items per page
- **Soft Deletes:** Faster "deletion" without actual removal
- **Response Time Tracking:** Monitor endpoint performance
- **Selective Field Loading:** Password and sensitive fields excluded by default

## Testing

The project includes comprehensive unit and integration tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

**Test Coverage:**
- Unit tests for services (auth, tasks)
- Integration tests for API endpoints
- MongoDB Memory Server for isolated testing
- Target coverage: 70%+ for all metrics

## License

ISC


## Production Deployment Checklist

- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Configure `CORS_ORIGIN` to whitelist only your frontend domains
- [ ] Set `NODE_ENV=production`
- [ ] Use a proper MongoDB instance (Atlas, AWS DocumentDB, etc.)
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Configure log rotation and backup
- [ ] Review and adjust rate limits
- [ ] Set up automated backups for MongoDB
- [ ] Use environment-specific configuration
- [ ] Enable MongoDB authentication
- [ ] Review and minimize error message verbosity

## Recent Improvements (v2.0)

### Security Enhancements
✅ Refresh token implementation with token rotation  
✅ Separate access and refresh token secrets  
✅ Generic error messages (no information leakage)  
✅ XSS protection with xss-clean  
✅ NoSQL injection protection  
✅ User-based rate limiting  
✅ Stricter auth endpoint rate limiting  
✅ Request size limits  
✅ Password strength validation (requires number)  
✅ CORS whitelist configuration  

### Performance & Scalability
✅ Pagination for all task queries  
✅ MongoDB compound indexes  
✅ Full-text search with text indexes  
✅ Soft delete for data recovery  
✅ Response compression with threshold  
✅ Connection pooling optimization  
✅ Response time tracking  

### Code Quality
✅ Winston logger with daily rotation  
✅ API versioning (v1)  
✅ Comprehensive unit tests  
✅ Integration tests with supertest  
✅ MongoDB Memory Server for testing  
✅ Improved error handling with proper status codes  
✅ Input sanitization and validation  
✅ Better MongoDB configuration  

### Features
✅ Confirmation required for destructive operations  
✅ Task statistics with overdue count  
✅ Completion rate calculation  
✅ Last login tracking  
✅ Token revocation on logout  
✅ Health check with DB status  
✅ User account status (isActive)  
✅ Enhanced validation messages  

## API Rate Limits

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Global (all /api) | 100 requests | 15 minutes |
| Auth (login/register) | 5 requests | 15 minutes |
| Authenticated users | 200 requests | 15 minutes |

## Logging

Logs are stored in the `logs/` directory:
- `error-YYYY-MM-DD.log` - Error logs only
- `combined-YYYY-MM-DD.log` - All logs
- Logs rotate daily
- Logs are kept for 14 days

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC
