---
layout: default
title: User Management
---

# User Management Endpoints

## Get Current User Profile
**GET /api/users/profile**

Get the current authenticated user's profile information.

**Authorization:** Bearer token required

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
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
```

## Update User Profile
**PUT /api/users/profile**

Update the current authenticated user's profile information.

**Authorization:** Bearer token required

**Request Body:**
```json
{
  "username": "newusername",
  "country_code": "CA",
  "profile_picture_url": "https://example.com/new-avatar.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "newusername",
    "country_code": "CA",
    "profile_picture_url": "https://example.com/new-avatar.jpg",
    "is_active": true,
    "role": "student",
    "created_at": "2023-07-01T00:00:00.000Z",
    "updated_at": "2023-07-20T12:34:56.789Z"
  }
}
```

## Update User Password
**PUT /api/users/password**

Update the current authenticated user's password.

**Authorization:** Bearer token required

**Request Body:**
```json
{
  "current_password": "CurrentP@ssw0rd",
  "new_password": "NewSecureP@ssw0rd"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "message": "Password updated successfully"
  }
}
```

## Get All Users (Admin Only)
**GET /api/users**

Get a paginated list of all users in the system.

**Authorization:** Admin role required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Field to sort by
- `sortOrder` (optional): Sort order (asc/desc)
- `role` (optional): Filter by user role (student/content_creator/admin)
- `is_active` (optional): Filter by active status (true/false)
- `search` (optional): Search term for email/username

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user1@example.com",
      "username": "user1",
      "role": "student",
      "is_active": true,
      "created_at": "2023-07-01T00:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "creator@example.com",
      "username": "creator1",
      "role": "content_creator",
      "is_active": true,
      "created_at": "2023-07-02T00:00:00.000Z"
    }
  ]
}
```

## Get User by ID (Admin Only)
**GET /api/users/:id**

Get detailed information about a specific user.

**Authorization:** Admin role required

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
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
```

## Update User Role (Admin Only)
**PUT /api/users/:id/role**

Update a user's role in the system.

**Authorization:** Admin role required

**Request Body:**
```json
{
  "role": "content_creator"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "content_creator",
    "updated_at": "2023-07-20T12:34:56.789Z"
  }
}
```