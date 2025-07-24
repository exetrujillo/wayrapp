# Manual Session Expiration Testing Guide

This guide provides manual testing steps to verify that session expiration handling works correctly with the production API.

## Prerequisites

1. Ensure the application is configured to use the production API:
   ```
   VITE_API_URL=https://wayrapp.vercel.app/api/v1
   VITE_ENABLE_MSW=false
   ```

2. Have valid test credentials for the production API

## Test Scenarios

### 1. Session Expiration During App Initialization

**Steps:**
1. Log in to the application successfully
2. Close the browser tab (don't log out)
3. Wait for the session to expire on the server (or manually clear the access token from localStorage but keep the refresh token)
4. Open the application again

**Expected Behavior:**
- Application should show "Validating session..." loading state
- Should attempt to refresh the token automatically
- If refresh fails, should redirect to login page with appropriate error message
- Should clear all authentication data from localStorage

### 2. Session Expiration During App Usage

**Steps:**
1. Log in to the application successfully
2. Navigate to different protected routes (dashboard, courses, profile)
3. Wait for the periodic token validation to trigger (every 5 minutes)
4. Or manually trigger by calling `authService.getCurrentUserProfile()` in browser console

**Expected Behavior:**
- If token is still valid, should continue working normally
- If token expired but refresh token is valid, should refresh automatically
- If both tokens expired, should redirect to login page
- User should see appropriate feedback during the process

### 3. Network Error Handling

**Steps:**
1. Log in to the application successfully
2. Disconnect from the internet or block the API domain
3. Wait for periodic validation or manually trigger profile fetch

**Expected Behavior:**
- Should not log out the user for network errors
- Should display appropriate error message
- Should retry when connection is restored
- User should remain on the current page

### 4. Server Error Handling

**Steps:**
1. Log in to the application successfully
2. Simulate server errors (if possible) or wait for actual server issues
3. Observe behavior during profile validation

**Expected Behavior:**
- Should not log out the user for server errors (5xx)
- Should display appropriate error message
- Should retry when server is restored
- User should remain authenticated locally

### 5. Protected Route Access

**Steps:**
1. Start with no authentication (clear localStorage)
2. Try to access protected routes directly via URL:
   - `/dashboard`
   - `/courses`
   - `/profile`
   - `/lessons`

**Expected Behavior:**
- Should redirect to `/login` immediately
- Should preserve the intended destination in navigation state
- After successful login, should redirect back to intended page

### 6. Token Refresh Success

**Steps:**
1. Log in to the application
2. Manually expire the access token (modify it in localStorage)
3. Keep the refresh token valid
4. Trigger a protected action or wait for periodic validation

**Expected Behavior:**
- Should automatically refresh the access token
- Should continue with the requested action
- User should not notice any interruption
- New tokens should be stored in localStorage

## Debugging Tips

### Browser Console Commands

```javascript
// Check current authentication state
console.log('Authenticated:', authService.isAuthenticated());
console.log('User:', authService.getCurrentUser());

// Check stored tokens
console.log('Access Token:', localStorage.getItem('auth_token'));
console.log('Refresh Token:', localStorage.getItem('refresh_token'));

// Manually trigger profile fetch
authService.getCurrentUserProfile()
  .then(user => console.log('Profile:', user))
  .catch(error => console.error('Profile Error:', error));

// Manually trigger token refresh
authService.refreshToken()
  .then(response => console.log('Refresh Success:', response))
  .catch(error => console.error('Refresh Error:', error));
```

### Network Tab Monitoring

Monitor the following API calls in the browser's Network tab:
- `POST /auth/login` - Initial login
- `GET /auth/me` - Profile validation
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - Logout

### Console Log Monitoring

Look for these log messages in the browser console:
- "Fetching user profile from /auth/me endpoint for session validation"
- "User profile successfully fetched and validated from /auth/me endpoint"
- "Session validation failed when fetching user profile"
- "Attempting token refresh due to expired session"
- "Session successfully refreshed and user profile updated"
- "Token refresh failed"
- "Performing automatic logout due to session issues"

## Expected Results Summary

✅ **Pass Criteria:**
- Expired sessions redirect to login with clear error messages
- Token refresh works automatically when possible
- Network errors don't cause unnecessary logouts
- Server errors don't cause unnecessary logouts
- Protected routes are properly secured
- User experience is smooth during token refresh
- Authentication state is properly cleaned up on logout

❌ **Fail Criteria:**
- User gets stuck in loading state
- Unnecessary logouts on network/server errors
- Token refresh fails when it should succeed
- Protected routes accessible without authentication
- Authentication state persists after logout
- Poor user feedback during authentication issues

## Troubleshooting

If tests fail, check:
1. API endpoint configuration
2. Network connectivity
3. Server status
4. Token format and expiration
5. localStorage data integrity
6. Console error messages
7. Network request/response details