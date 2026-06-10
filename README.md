# Task Tracker Backend API

Express.js REST API for the Task Tracker application with MongoDB.

## Features

- ✅ User authentication (JWT)
- ✅ Task CRUD operations
- ✅ Subtask management
- ✅ Task filtering & sorting
- ✅ Dashboard statistics
- ✅ Input validation
- ✅ Error handling
- ✅ Security middleware (Helmet, CORS, Rate limiting)

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** express-validator
- **Security:** Helmet, CORS, bcryptjs, express-rate-limit

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
JWT_EXPIRE=7d
```

5. Start MongoDB (make sure MongoDB is running)

6. Run the server:
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Tasks
- `GET /api/tasks` - Get all tasks (with filters)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/complete` - Toggle task completion
- `DELETE /api/tasks/:id` - Delete task
- `DELETE /api/tasks` - Clear all tasks

### Subtasks
- `POST /api/tasks/:id/subtasks` - Add subtask
- `PUT /api/tasks/:taskId/subtasks/:subtaskId` - Update subtask
- `PATCH /api/tasks/:taskId/subtasks/:subtaskId/complete` - Toggle subtask
- `DELETE /api/tasks/:taskId/subtasks/:subtaskId` - Delete subtask

### Dashboard
- `GET /api/dashboard/stats` - Get task statistics

## Query Parameters for GET /api/tasks

- `completed` - Filter by completion status (true/false)
- `priority` - Filter by priority (0=low, 1=medium, 2=high, 3=urgent)
- `category` - Filter by category
- `search` - Search in title and description
- `sortBy` - Sort by field (dueDate, priority, createdAt)

**Example:**
```
GET /api/tasks?completed=false&priority=3&sortBy=dueDate
```

## Request Examples

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Task
```bash
POST /api/tasks
Authorization: Bearer <token>
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
PUT /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "isCompleted": true
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
- name (String, required)
- email (String, required, unique)
- password (String, required, hashed)

### Task
- userId (ObjectId, required)
- title (String, required)
- description (String)
- isCompleted (Boolean, default: false)
- completedAt (Date)
- dueDate (Date)
- priority (Number: 0-3)
- category (String, default: "Personal")
- subtasks (Array of SubTask)

### SubTask
- title (String, required)
- isCompleted (Boolean, default: false)

## Security Features

- Password hashing with bcrypt
- JWT authentication
- Rate limiting (100 requests per 15 minutes)
- Helmet.js for security headers
- CORS enabled
- Input validation and sanitization

## Project Structure

```
task-tracker-backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── app.js           # Express app setup
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
├── README.md
└── server.js            # Server entry point
```

## License

ISC
