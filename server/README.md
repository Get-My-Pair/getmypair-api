# GetMyPair API Server

A robust Node.js/Express API server with authentication, OTP verification, role-based access control, and comprehensive security features.

## Features

- 🔐 JWT-based authentication with refresh tokens
- 📧 Email verification via OTP
- 🔑 Password reset functionality
- 👥 Role-based access control (RBAC)
- 📊 Audit logging for security and compliance
- 🛡️ Rate limiting and security middleware
- 🗄️ MongoDB with Mongoose ODM
- ✅ Input validation and sanitization
- 📝 Comprehensive error handling
- 🧪 Test suite with Jest

## Project Structure

```
server/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server entry point
│   ├── config/                # Configuration files
│   ├── routes/                # API routes
│   ├── controllers/           # Request handlers
│   ├── services/              # Business logic
│   ├── models/                # Mongoose models
│   ├── middleware/            # Custom middleware
│   ├── utils/                 # Utility functions
│   └── validations/           # Input validation schemas
├── tests/                     # Test files
├── .env.example               # Environment variables template
├── package.json
└── README.md
```

## Prerequisites

- Node.js (>=16.0.0)
- npm (>=8.0.0)
- MongoDB (local or remote instance)

## Installation

1. Clone the repository and navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
   - Set your MongoDB connection string
   - Generate a secure JWT secret
   - Configure other settings as needed

5. Start MongoDB (if running locally):
```bash
# Make sure MongoDB is running on your system
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 3000).

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/request-password-reset` - Request password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user (requires authentication)
- `GET /api/auth/profile` - Get user profile (requires authentication)

### Health Check

- `GET /health` - Server health check

## Environment Variables

See `.env.example` for all available environment variables.

### Key Variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `DB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Access token expiration (default: 7d)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration (default: 30d)

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Security Features

- **Helmet.js** - Sets various HTTP headers for security
- **CORS** - Configurable cross-origin resource sharing
- **Rate Limiting** - Prevents abuse and brute force attacks
- **Input Validation** - Validates and sanitizes all inputs
- **Password Hashing** - Uses bcrypt for secure password storage
- **JWT Tokens** - Secure token-based authentication
- **Session Management** - Tracks and manages user sessions
- **Audit Logging** - Logs all important actions for security auditing

## Database Models

- **User** - User accounts with authentication
- **Role** - User roles and permissions
- **OTP** - One-time passwords for verification
- **Session** - Active user sessions
- **AuditLog** - Security and activity audit logs

## Error Handling

The API uses a centralized error handling middleware that:
- Catches all errors
- Logs errors appropriately
- Returns consistent error responses
- Handles validation errors, JWT errors, and database errors

## Rate Limiting

Different endpoints have different rate limits:
- **General API**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per 15 minutes
- **OTP endpoints**: 3 requests per 15 minutes

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

ISC
