# GetMyPair API Server

A comprehensive mobile OTP-based authentication API built with Express.js, MongoDB, and JWT.

## Features

- Mobile OTP-based authentication (no passwords required)
- User registration via mobile number with OTP verification
- JWT-based authentication with access and refresh tokens
- Role-based access control (RBAC)
- Session management
- Profile completion flow (name, DOB, gender)
- Comprehensive audit logging
- Input validation
- Error handling

## Technology Stack

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **OTP Generation**: Random numeric OTP
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

- `POST /api/auth/send-otp` - Send OTP to mobile number
- `POST /api/auth/verify-otp` - Verify OTP and check if user exists (returns tokens if existing user, or profile completion flag)
- `POST /api/auth/complete-profile` - Complete profile for new users (name, DOB, gender) and get JWT tokens
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile

## Authentication Flow

1. **Enter Mobile Number** → `POST /api/auth/send-otp`
2. **Generate Random OTP** → Stored in database (hashed)
3. **OTP Verification** → `POST /api/auth/verify-otp`
   - If user exists → Login success (returns JWT tokens)
   - If new user → Returns profile completion flag
4. **Complete Profile** (for new users) → `POST /api/auth/complete-profile`
   - Provide: name, dateOfBirth, gender
   - Returns JWT tokens upon successful registration

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
