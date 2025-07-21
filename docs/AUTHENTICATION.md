# Authentication Endpoints

## Register a New User
**POST /api/auth/register**

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd",
  "username": "johndoe",
  "country_code": "US",
  "profile_picture_url": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "student"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

## User Login
**POST /api/auth/login**

Authenticate a user and receive access and refresh tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "student"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

## Refresh Token
**POST /api/auth/refresh**

Get a new access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

## Logout
**POST /api/auth/logout**

Invalidate the refresh token.

**Headers:**
- Authorization: Bearer {accessToken}

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "message": "Logged out successfully. Please remove tokens from client storage."
  }
}
```

## Get Current User
**GET /api/auth/me**

Get the current authenticated user's information.

**Headers:**
- Authorization: Bearer {accessToken}

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "johndoe",
      "country_code": "US",
      "registration_date": "2023-07-01T00:00:00.000Z",
      "last_login_date": "2023-07-20T12:30:00.000Z",
      "profile_picture_url": "https://example.com/avatar.jpg",
      "is_active": true,
      "role": "student",
      "created_at": "2023-07-01T00:00:00.000Z",
      "updated_at": "2023-07-20T12:34:56.789Z"
    }
  }
}
```