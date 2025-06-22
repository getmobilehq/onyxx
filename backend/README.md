# Onyx Backend API

Backend API for the Onyx Building Assessment Platform built with Node.js, Express, TypeScript, and PostgreSQL.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run database migration:**
   ```bash
   npm run migrate
   ```
   This will create all necessary tables and a default admin user.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The API will be running at `http://localhost:5000`

## Default Credentials

After running migrations, you can login with:
- Email: `admin@onyx.com`
- Password: `admin123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (Admin/Manager only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)
- `POST /api/users/invite` - Invite new user (Admin/Manager only)

## Project Structure

```
backend/
├── src/
│   ├── config/         # Database and app configuration
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── server.ts       # Express app entry point
├── .env                # Environment variables
├── .env.example        # Environment variables example
├── tsconfig.json       # TypeScript configuration
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations

## Security Features

- Password hashing with bcrypt
- JWT authentication
- CORS protection
- Helmet.js for security headers
- Input validation with express-validator
- SQL injection protection with parameterized queries

## Error Handling

All errors are handled consistently with the format:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [] // Validation errors if applicable
}
```

## Next Steps

1. Add more API endpoints for buildings, assessments, and reports
2. Implement email service for user invitations
3. Add rate limiting
4. Set up logging with Winston
5. Add unit and integration tests
6. Set up CI/CD pipeline