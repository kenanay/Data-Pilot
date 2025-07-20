# Authentication Integration Documentation

## Overview

This document describes the JWT authentication system integration between the main Data Pilot application and the Pipeline Dashboard, providing a seamless single sign-on (SSO) experience.

## Architecture

### Shared Authentication System

The authentication system uses shared localStorage keys and utilities to maintain session consistency across both applications:

- **Main Data Pilot App**: Handles user login/logout and token management
- **Pipeline Dashboard**: Consumes shared authentication state and redirects to main app for login
- **Shared Storage**: Uses consistent localStorage keys for tokens and user data

### Key Components

#### 1. Shared Authentication Utilities (`shared-auth.js`)
- Centralized token management
- Cross-tab synchronization
- Consistent storage key naming
- JWT token parsing and validation

#### 2. Main App Integration (`frontend/src/auth.js`)
- Updated to use shared utilities
- Handles redirect URLs from pipeline dashboard
- Maintains backward compatibility

#### 3. Pipeline Dashboard Integration
- **useAuth Hook**: Integrated authentication state management
- **ProtectedRoute Component**: Route protection with redirect to main app
- **Login Component**: Redirect interface instead of login form
- **API Service**: Automatic token injection and refresh

## Authentication Flow

### Initial Login (Main App)
1. User accesses main Data Pilot application
2. User enters credentials in login form
3. Backend validates credentials and returns JWT token
4. Token and user data stored in shared localStorage
5. User redirected to dashboard or specified redirect URL

### Pipeline Dashboard Access
1. User accesses pipeline dashboard URL
2. ProtectedRoute checks authentication status
3. If authenticated: User sees dashboard
4. If not authenticated: User sees redirect interface
5. Click "Sign in with Data Pilot" redirects to main app login
6. After login, user automatically redirected back to pipeline dashboard

### Token Refresh
1. Both apps monitor token expiration
2. When token expires soon, automatic refresh attempted
3. If refresh fails, user redirected to main app login
4. Cross-tab synchronization ensures consistent state

## Storage Keys

```javascript
const TOKEN_KEY = "auth_token";           // JWT token
const USER_INFO_KEY = "user_info";       // User profile data
const TOKEN_EXPIRY_KEY = "token_expiry"; // Token expiration timestamp
```

## API Integration

### Main Data Pilot API Endpoints
- `POST /auth/login` - User authentication
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Token refresh
- `GET /auth/me` - Get current user info

### Pipeline Dashboard API
- Uses same JWT tokens for authentication
- Automatic token injection via axios interceptors
- Handles 401 responses with redirect to main app

## Security Features

### Token Management
- Automatic expiration checking
- Secure token storage in localStorage
- Token refresh before expiration
- Cleanup on logout or expiration

### Cross-Origin Protection
- Redirect URL validation
- Same-origin policy enforcement
- Secure token transmission

### Session Synchronization
- Cross-tab login/logout synchronization
- Storage event listeners
- Consistent authentication state

## Implementation Details

### Main App Changes

#### Login Component (`frontend/src/pages/Login.jsx`)
```javascript
// Handle redirect after login
const redirectUrl = getRedirectUrl() || location.state?.from?.pathname;
if (redirectUrl) {
  handlePostLoginRedirect(redirectUrl);
} else {
  navigate("/dashboard");
}
```

#### Auth Utilities (`frontend/src/auth.js`)
```javascript
// Import shared authentication utilities
import SharedAuth from '../../shared-auth.js';
export const { isAuthenticated, login, logout, ... } = SharedAuth;
```

### Pipeline Dashboard Changes

#### useAuth Hook (`pipeline-dashboard/frontend/src/hooks/useAuth.js`)
```javascript
// Redirect to main app for authentication
const redirectToLogin = useCallback(() => {
  const currentUrl = window.location.href;
  const loginUrl = `${MAIN_API_URL.replace(':8081', ':3000')}/login?redirect=${encodeURIComponent(currentUrl)}`;
  window.location.href = loginUrl;
}, []);
```

#### ProtectedRoute Component
```javascript
// Show login redirect if not authenticated
if (!isAuthenticated || !user) {
  return <Login onSuccess={() => window.location.reload()} />;
}
```

## Testing

### Unit Tests
- Authentication state management
- Token validation and refresh
- Cross-tab synchronization
- Protected route behavior

### Integration Tests
- End-to-end login flow
- Redirect functionality
- Token refresh scenarios
- Cross-application navigation

## Configuration

### Environment Variables

#### Main App
```env
REACT_APP_API_URL=http://localhost:8081
```

#### Pipeline Dashboard
```env
REACT_APP_PIPELINE_API_URL=http://localhost:8000
REACT_APP_MAIN_API_URL=http://localhost:8081
```

### URL Structure
- Main App: `http://localhost:3000`
- Pipeline Dashboard: `http://localhost:3001` (or integrated route)
- API Backend: `http://localhost:8081`

## Deployment Considerations

### Production Setup
1. Configure CORS for cross-origin requests
2. Use HTTPS for secure token transmission
3. Set appropriate token expiration times
4. Implement proper error handling and logging

### Monitoring
- Track authentication success/failure rates
- Monitor token refresh patterns
- Log cross-application navigation
- Alert on authentication errors

## Troubleshooting

### Common Issues

#### Token Not Shared Between Apps
- Check localStorage key consistency
- Verify same-origin policy compliance
- Ensure proper storage event handling

#### Redirect Loop
- Validate redirect URL format
- Check for circular redirect conditions
- Verify token expiration handling

#### Cross-Tab Sync Issues
- Confirm storage event listeners
- Check localStorage access permissions
- Verify event handler cleanup

### Debug Tools
- Browser developer tools (Application > Local Storage)
- Network tab for API requests
- Console logs for authentication events

## Future Enhancements

### Planned Features
- Remember me functionality
- Multi-factor authentication support
- Session timeout warnings
- Advanced security headers

### Scalability
- Redis session storage for multi-server deployments
- JWT refresh token rotation
- Advanced token validation
- Audit logging and compliance

## Support

For technical support or questions about the authentication integration:
- Review this documentation
- Check the test files for usage examples
- Consult the API documentation
- Contact the development team

---

**Author**: Kenan AY  
**Project**: Data Pilot & Pipeline Dashboard Integration  
**Date**: 2025  
**Version**: 1.0.0