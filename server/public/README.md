# Frontend UI for Mobile OTP Authentication

This folder contains a sample HTML frontend for testing the mobile OTP authentication API.

## Features

- **Mobile Number Input** - Enter mobile number to receive OTP
- **OTP Verification** - Verify 6-digit OTP code
- **Profile Completion** - For new users, complete profile with name, DOB, and gender
- **Dashboard** - View user information after successful login
- **Auto-login** - Automatically loads user profile if token exists in localStorage

## How to Use

1. Make sure your server is running on `http://localhost:3000`
2. Open `index.html` in your browser or navigate to `http://localhost:3000`
3. Follow the authentication flow:
   - Enter mobile number
   - Enter OTP code (check server logs for OTP)
   - Complete profile (if new user)
   - View dashboard

## API Integration

The frontend integrates with the following API endpoints:

- `POST /api/auth/send-otp` - Send OTP to mobile number
- `POST /api/auth/verify-otp` - Verify OTP and check if user exists
- `POST /api/auth/complete-profile` - Complete profile for new users
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user

## Configuration

To change the API base URL, edit the `API_BASE_URL` constant in the JavaScript section:

```javascript
const API_BASE_URL = 'http://localhost:3000/api/auth';
```

## Notes

- OTP is displayed in server console logs (for development/testing)
- Tokens are stored in localStorage
- The UI includes error handling and loading states
- Responsive design works on mobile and desktop

