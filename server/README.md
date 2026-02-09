# GetMyPair API Server

A comprehensive authentication API built with Express.js, MongoDB, and JWT.

## Features

- User registration with email/phone verification via OTP
- JWT-based authentication with access and refresh tokens
- Role-based access control (RBAC)
- Session management
- Password reset functionality
- Account security (lockout, rate limiting)
- Comprehensive audit logging
- Input validation
- Error handling

## Technology Stack

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **OTP Generation**: speakeasy
- **Rate Limiting**: express-rate-limit
- **Validation**: express-validator
- **Logging**: Winston

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `server` directory (use `.env.example` as a template)

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

See `.env.example` for all required environment variables.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/send-otp` - Send OTP for verification
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Project Structure

```
server/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server entry point
│   ├── config/                # Configuration files
│   ├── models/                # Mongoose models
│   ├── services/              # Business logic
│   ├── controllers/           # Request handlers
│   ├── routes/                # Route definitions
│   ├── middleware/            # Custom middleware
│   ├── validations/           # Input validation
│   └── utils/                 # Utility functions
├── tests/                     # Test files
├── .env.example              # Environment variables template
├── package.json              # Dependencies
└── README.md                 # This file
```

## Documentation

For detailed API documentation, see `docs/Auth Module 1/AUTH_DETAILED.md`.

## License

ISC
