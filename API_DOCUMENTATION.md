# WayrApp API Documentation

## Base URL
All API endpoints are prefixed with `/api`

## Response Format
All API responses follow a consistent format:

```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    // Response data here
  }
}
```

For paginated responses, pagination information is included in response headers:
- `X-Total-Count`: Total number of items
- `X-Total-Pages`: Total number of pages
- `X-Current-Page`: Current page number
- `X-Has-Next`: Whether there are more pages
- `X-Has-Prev`: Whether there are previous pages

## Authentication Endpoints

### Register a New User
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

### User Login
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

### Refresh Token
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

### Logout
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

### Get Current User
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

## Authentication Security Features

### Password Security
- Passwords are hashed using bcrypt before storage
- Password requirements enforced:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

### JWT Authentication
- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Refresh tokens can be revoked on logout
- Blacklisted tokens are stored in the database

### Role-Based Access Control
- Three user roles: student, content_creator, admin
- Granular permissions system for each role
- Resource ownership validation for user-specific resources

### Security Measures
- Rate limiting on authentication endpoints
- Input validation and sanitization
- CORS protection
- Secure HTTP headers

## User Management Endpoints

### Get Current User Profile
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

### Update User Profile
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

### Update User Password
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

### Get All Users (Admin Only)
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

### Get User by ID (Admin Only)
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

### Update User Role (Admin Only)
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

## Content Management Endpoints

### Courses

#### Get All Courses
**GET /api/courses**

Get a paginated list of all courses.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Field to sort by (default: created_at)
- `sortOrder` (optional): Sort order (asc/desc, default: desc)
- `source_language` (optional): Filter by source language (2-letter code)
- `target_language` (optional): Filter by target language (2-letter code)
- `is_public` (optional): Filter by public status (true/false)

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": [
    {
      "id": "en-es-basic",
      "source_language": "en",
      "target_language": "es",
      "name": "English to Spanish - Basic",
      "description": "Learn basic Spanish from English",
      "is_public": true,
      "levels_count": 5,
      "created_at": "2023-07-01T00:00:00.000Z",
      "updated_at": "2023-07-15T00:00:00.000Z"
    }
  ]
}
```

#### Create Course
**POST /api/courses**

Create a new course.

**Authorization:** Admin or Content Creator role required

**Request Body:**
```json
{
  "id": "en-fr-basic",
  "source_language": "en",
  "target_language": "fr",
  "name": "English to French - Basic",
  "description": "Learn basic French from English",
  "is_public": true
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "en-fr-basic",
    "source_language": "en",
    "target_language": "fr",
    "name": "English to French - Basic",
    "description": "Learn basic French from English",
    "is_public": true,
    "created_at": "2023-07-20T12:34:56.789Z",
    "updated_at": "2023-07-20T12:34:56.789Z"
  }
}
```

#### Get Course by ID
**GET /api/courses/:id**

Get detailed information about a specific course.

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "en-es-basic",
    "source_language": "en",
    "target_language": "es",
    "name": "English to Spanish - Basic",
    "description": "Learn basic Spanish from English",
    "is_public": true,
    "levels_count": 5,
    "created_at": "2023-07-01T00:00:00.000Z",
    "updated_at": "2023-07-15T00:00:00.000Z"
  }
}
```

#### Update Course
**PUT /api/courses/:id**

Update an existing course.

**Authorization:** Admin or Content Creator role required

**Request Body:**
```json
{
  "name": "English to Spanish - Updated",
  "description": "Updated description",
  "is_public": false
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "en-es-basic",
    "source_language": "en",
    "target_language": "es",
    "name": "English to Spanish - Updated",
    "description": "Updated description",
    "is_public": false,
    "levels_count": 5,
    "created_at": "2023-07-01T00:00:00.000Z",
    "updated_at": "2023-07-20T12:34:56.789Z"
  }
}
```

#### Delete Course
**DELETE /api/courses/:id**

Delete a course and all its associated content.

**Authorization:** Admin role required

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "message": "Course deleted successfully"
}
```

#### Get Packaged Course
**GET /api/courses/:id/package**

Get a complete course package with all nested content for offline use.

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "course": {
      "id": "en-es-basic",
      "source_language": "en",
      "target_language": "es",
      "name": "English to Spanish - Basic",
      "description": "Learn basic Spanish from English",
      "is_public": true,
      "created_at": "2023-07-01T00:00:00.000Z",
      "updated_at": "2023-07-15T00:00:00.000Z"
    },
    "levels": [
      {
        "id": "en-es-basic-level1",
        "course_id": "en-es-basic",
        "code": "A1",
        "name": "Beginner Level",
        "order": 1,
        "sections": [
          {
            "id": "en-es-basic-level1-section1",
            "level_id": "en-es-basic-level1",
            "name": "Greetings",
            "order": 1,
            "modules": [
              {
                "id": "en-es-basic-level1-section1-module1",
                "section_id": "en-es-basic-level1-section1",
                "module_type": "basic_lesson",
                "name": "Basic Greetings",
                "order": 1,
                "lessons": []
              }
            ]
          }
        ]
      }
    ],
    "package_version": "2023-07-15T00:00:00.000Z"
  }
}
```

### Levels

#### Get Levels by Course
**GET /api/courses/:courseId/levels**

Get all levels for a specific course.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Field to sort by (default: order)
- `sortOrder` (optional): Sort order (asc/desc, default: asc)

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": [
    {
      "id": "en-es-basic-level1",
      "course_id": "en-es-basic",
      "code": "A1",
      "name": "Beginner Level",
      "order": 1,
      "sections_count": 3,
      "created_at": "2023-07-01T00:00:00.000Z",
      "updated_at": "2023-07-01T00:00:00.000Z"
    }
  ]
}
```

#### Create Level
**POST /api/courses/:courseId/levels**

Create a new level within a course.

**Authorization:** Admin or Content Creator role required

**Request Body:**
```json
{
  "id": "en-es-basic-level2",
  "code": "A2",
  "name": "Elementary Level",
  "order": 2
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "en-es-basic-level2",
    "course_id": "en-es-basic",
    "code": "A2",
    "name": "Elementary Level",
    "order": 2,
    "created_at": "2023-07-20T12:34:56.789Z",
    "updated_at": "2023-07-20T12:34:56.789Z"
  }
}
```

#### Get Level by ID
**GET /api/courses/:courseId/levels/:id**

Get detailed information about a specific level.

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "en-es-basic-level1",
    "course_id": "en-es-basic",
    "code": "A1",
    "name": "Beginner Level",
    "order": 1,
    "sections_count": 3,
    "created_at": "2023-07-01T00:00:00.000Z",
    "updated_at": "2023-07-01T00:00:00.000Z"
  }
}
```

#### Update Level
**PUT /api/courses/:courseId/levels/:id**

Update an existing level.

**Authorization:** Admin or Content Creator role required

**Request Body:**
```json
{
  "name": "Updated Beginner Level",
  "code": "A1-NEW"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "en-es-basic-level1",
    "course_id": "en-es-basic",
    "code": "A1-NEW",
    "name": "Updated Beginner Level",
    "order": 1,
    "sections_count": 3,
    "created_at": "2023-07-01T00:00:00.000Z",
    "updated_at": "2023-07-20T12:34:56.789Z"
  }
}
```

#### Delete Level
**DELETE /api/courses/:courseId/levels/:id**

Delete a level and all its associated content.

**Authorization:** Admin role required

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "message": "Level deleted successfully"
}
```

### Sections

#### Get Sections by Level
**GET /api/levels/:levelId/sections**

Get all sections for a specific level.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Field to sort by (default: order)
- `sortOrder` (optional): Sort order (asc/desc, default: asc)

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": [
    {
      "id": "en-es-basic-level1-section1",
      "level_id": "en-es-basic-level1",
      "name": "Greetings",
      "order": 1,
      "modules_count": 2,
      "created_at": "2023-07-01T00:00:00.000Z",
      "updated_at": "2023-07-01T00:00:00.000Z"
    }
  ]
}
```

#### Create Section
**POST /api/levels/:levelId/sections**

Create a new section within a level.

**Authorization:** Admin or Content Creator role required

**Request Body:**
```json
{
  "id": "en-es-basic-level1-section2",
  "name": "Numbers",
  "order": 2
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "en-es-basic-level1-section2",
    "level_id": "en-es-basic-level1",
    "name": "Numbers",
    "order": 2,
    "created_at": "2023-07-20T12:34:56.789Z",
    "updated_at": "2023-07-20T12:34:56.789Z"
  }
}
```

#### Get Section by ID
**GET /api/levels/:levelId/sections/:id**

Get detailed information about a specific section.

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "en-es-basic-level1-section1",
    "level_id": "en-es-basic-level1",
    "name": "Greetings",
    "order": 1,
    "modules_count": 2,
    "created_at": "2023-07-01T00:00:00.000Z",
    "updated_at": "2023-07-01T00:00:00.000Z"
  }
}
```

#### Update Section
**PUT /api/levels/:levelId/sections/:id**

Update an existing section.

**Authorization:** Admin or Content Creator role required

**Request Body:**
```json
{
  "name": "Updated Greetings Section"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "en-es-basic-level1-section1",
    "level_id": "en-es-basic-level1",
    "name": "Updated Greetings Section",
    "order": 1,
    "modules_count": 2,
    "created_at": "2023-07-01T00:00:00.000Z",
    "updated_at": "2023-07-20T12:34:56.789Z"
  }
}
```

#### Delete Section
**DELETE /api/levels/:levelId/sections/:id**

Delete a section and all its associated content.

**Authorization:** Admin role required

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "message": "Section deleted successfully"
}
```

### Modules

#### Get Modules by Section
**GET /api/sections/:sectionId/modules**

Get all modules for a specific section.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Field to sort by (default: order)
- `sortOrder` (optional): Sort order (asc/desc, default: asc)
- `module_type` (optional): Filter by module type (informative/basic_lesson/reading/dialogue/exam)

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": [
    {
      "id": "en-es-basic-level1-section1-module1",
      "section_id": "en-es-basic-level1-section1",
      "module_type": "basic_lesson",
      "name": "Basic Greetings",
      "order": 1,
      "lessons_count": 3,
      "created_at": "2023-07-01T00:00:00.000Z",
      "updated_at": "2023-07-01T00:00:00.000Z"
    }
  ]
}
```

#### Create Module
**POST /api/sections/:sectionId/modules**

Create a new module within a section.

**Authorization:** Admin or Content Creator role required

**Request Body:**
```json
{
  "id": "en-es-basic-level1-section1-module2",
  "module_type": "reading",
  "name": "Reading Greetings",
  "order": 2
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "en-es-basic-level1-section1-module2",
    "section_id": "en-es-basic-level1-section1",
    "module_type": "reading",
    "name": "Reading Greetings",
    "order": 2,
    "created_at": "2023-07-20T12:34:56.789Z",
    "updated_at": "2023-07-20T12:34:56.789Z"
  }
}
```

#### Get Module by ID
**GET /api/sections/:sectionId/modules/:id**

Get detailed information about a specific module.

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "en-es-basic-level1-section1-module1",
    "section_id": "en-es-basic-level1-section1",
    "module_type": "basic_lesson",
    "name": "Basic Greetings",
    "order": 1,
    "lessons_count": 3,
    "created_at": "2023-07-01T00:00:00.000Z",
    "updated_at": "2023-07-01T00:00:00.000Z"
  }
}
```

#### Update Module
**PUT /api/sections/:sectionId/modules/:id**

Update an existing module.

**Authorization:** Admin or Content Creator role required

**Request Body:**
```json
{
  "name": "Updated Basic Greetings",
  "module_type": "dialogue"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "en-es-basic-level1-section1-module1",
    "section_id": "en-es-basic-level1-section1",
    "module_type": "dialogue",
    "name": "Updated Basic Greetings",
    "order": 1,
    "lessons_count": 3,
    "created_at": "2023-07-01T00:00:00.000Z",
    "updated_at": "2023-07-20T12:34:56.789Z"
  }
}
```

#### Delete Module
**DELETE /api/sections/:sectionId/modules/:id**

Delete a module and all its associated content.

**Authorization:** Admin role required

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "message": "Module deleted successfully"
}
```

### Lessons

#### Get Lessons by Module
**GET /api/modules/:moduleId/lessons**

Get all lessons for a specific module.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Field to sort by (default: order)
- `sortOrder` (optional): Sort order (asc/desc, default: asc)

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": [
    {
      "id": "en-es-basic-level1-section1-module1-lesson1",
      "module_id": "en-es-basic-level1-section1-module1",
      "experience_points": 10,
      "order": 1,
      "created_at": "2023-07-01T00:00:00.000Z",
      "updated_at": "2023-07-01T00:00:00.000Z",
      "exercises": [
        {
          "lesson_id": "en-es-basic-level1-section1-module1-lesson1",
          "exercise_id": "greeting-trans-1",
          "order": 1,
          "exercise": {
            "id": "greeting-trans-1",
            "exercise_type": "translation",
            "data": {
              "source_text": "Hello",
              "target_text": "Hola",
              "hints": ["greeting", "common"]
            },
            "created_at": "2023-07-01T00:00:00.000Z",
            "updated_at": "2023-07-01T00:00:00.000Z"
          }
        }
      ]
    }
  ]
}
```

#### Create Lesson
**POST /api/modules/:moduleId/lessons**

Create a new lesson within a module.

**Authorization:** Admin or Content Creator role required

**Request Body:**
```json
{
  "id": "en-es-basic-level1-section1-module1-lesson2",
  "experience_points": 15,
  "order": 2
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "en-es-basic-level1-section1-module1-lesson2",
    "module_id": "en-es-basic-level1-section1-module1",
    "experience_points": 15,
    "order": 2,
    "created_at": "2023-07-20T12:34:56.789Z",
    "updated_at": "2023-07-20T12:34:56.789Z"
  }
}
```

#### Get Lesson by ID
**GET /api/modules/:moduleId/lessons/:id**

Get detailed information about a specific lesson including all assigned exercises.

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "en-es-basic-level1-section1-module1-lesson1",
    "module_id": "en-es-basic-level1-section1-module1",
    "experience_points": 10,
    "order": 1,
    "created_at": "2023-07-01T00:00:00.000Z",
    "updated_at": "2023-07-01T00:00:00.000Z",
    "exercises": [
      {
        "lesson_id": "en-es-basic-level1-section1-module1-lesson1",
        "exercise_id": "greeting-trans-1",
        "order": 1,
        "exercise": {
          "id": "greeting-trans-1",
          "exercise_type": "translation",
          "data": {
            "source_text": "Hello",
            "target_text": "Hola",
            "hints": ["greeting", "common"]
          },
          "created_at": "2023-07-01T00:00:00.000Z",
          "updated_at": "2023-07-01T00:00:00.000Z"
        }
      }
    ]
  }
}
```

#### Update Lesson
**PUT /api/modules/:moduleId/lessons/:id**

Update an existing lesson.

**Authorization:** Admin or Content Creator role required

**Request Body:**
```json
{
  "experience_points": 20,
  "order": 3
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "en-es-basic-level1-section1-module1-lesson1",
    "module_id": "en-es-basic-level1-section1-module1",
    "experience_points": 20,
    "order": 3,
    "created_at": "2023-07-01T00:00:00.000Z",
    "updated_at": "2023-07-20T12:34:56.789Z",
    "exercises": []
  }
}
```

#### Delete Lesson
**DELETE /api/modules/:moduleId/lessons/:id**

Delete a lesson and all its exercise assignments.

**Authorization:** Admin role required

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "message": "Lesson deleted successfully"
}
```

#### Get Lesson Exercises
**GET /api/lessons/:lessonId/exercises**

Get all exercises assigned to a specific lesson in order.

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": [
    {
      "lesson_id": "en-es-basic-level1-section1-module1-lesson1",
      "exercise_id": "greeting-trans-1",
      "order": 1,
      "exercise": {
        "id": "greeting-trans-1",
        "exercise_type": "translation",
        "data": {
          "source_text": "Hello",
          "target_text": "Hola",
          "hints": ["greeting", "common"]
        },
        "created_at": "2023-07-01T00:00:00.000Z",
        "updated_at": "2023-07-01T00:00:00.000Z"
      }
    },
    {
      "lesson_id": "en-es-basic-level1-section1-module1-lesson1",
      "exercise_id": "greeting-vof-1",
      "order": 2,
      "exercise": {
        "id": "greeting-vof-1",
        "exercise_type": "vof",
        "data": {
          "statement": "Hola means Hello in Spanish",
          "is_true": true,
          "explanation": "Hola is the most common greeting in Spanish"
        },
        "created_at": "2023-07-01T00:00:00.000Z",
        "updated_at": "2023-07-01T00:00:00.000Z"
      }
    }
  ]
}
```

#### Assign Exercise to Lesson
**POST /api/lessons/:lessonId/exercises**

Assign an existing exercise to a lesson with a specific order.

**Authorization:** Admin or Content Creator role required

**Request Body:**
```json
{
  "exercise_id": "greeting-trans-2",
  "order": 3
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "lesson_id": "en-es-basic-level1-section1-module1-lesson1",
    "exercise_id": "greeting-trans-2",
    "order": 3,
    "exercise": {
      "id": "greeting-trans-2",
      "exercise_type": "translation",
      "data": {
        "source_text": "Good morning",
        "target_text": "Buenos días",
        "hints": ["greeting", "time"]
      },
      "created_at": "2023-07-01T00:00:00.000Z",
      "updated_at": "2023-07-01T00:00:00.000Z"
    }
  }
}
```

#### Unassign Exercise from Lesson
**DELETE /api/lessons/:lessonId/exercises/:exerciseId**

Remove an exercise assignment from a lesson.

**Authorization:** Admin or Content Creator role required

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "message": "Exercise unassigned from lesson successfully"
}
```

#### Reorder Lesson Exercises
**PUT /api/lessons/:lessonId/exercises/reorder**

Reorder all exercises within a lesson by providing the complete list of exercise IDs in the desired order.

**Authorization:** Admin or Content Creator role required

**Request Body:**
```json
{
  "exercise_ids": [
    "greeting-vof-1",
    "greeting-trans-1",
    "greeting-trans-2"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "message": "Lesson exercises reordered successfully"
}
```

### Exercises

#### Get All Exercises
**GET /api/exercises**

Get a paginated list of all exercises in the system.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Field to sort by (default: created_at)
- `sortOrder` (optional): Sort order (asc/desc, default: desc)
- `exercise_type` (optional): Filter by exercise type

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": [
    {
      "id": "greeting-trans-1",
      "exercise_type": "translation",
      "data": {
        "source_text": "Hello",
        "target_text": "Hola",
        "hints": ["greeting", "common"]
      },
      "created_at": "2023-07-01T00:00:00.000Z",
      "updated_at": "2023-07-01T00:00:00.000Z"
    },
    {
      "id": "greeting-vof-1",
      "exercise_type": "vof",
      "data": {
        "statement": "Hola means Hello in Spanish",
        "is_true": true,
        "explanation": "Hola is the most common greeting in Spanish"
      },
      "created_at": "2023-07-01T00:00:00.000Z",
      "updated_at": "2023-07-01T00:00:00.000Z"
    }
  ]
}
```

#### Create Exercise
**POST /api/exercises**

Create a new reusable exercise.

**Authorization:** Admin or Content Creator role required

**Request Body (Translation Exercise):**
```json
{
  "id": "greeting-trans-3",
  "exercise_type": "translation",
  "data": {
    "source_text": "Good evening",
    "target_text": "Buenas noches",
    "hints": ["greeting", "time", "evening"]
  }
}
```

**Request Body (Fill-in-the-blank Exercise):**
```json
{
  "id": "greeting-fill-1",
  "exercise_type": "fill-in-the-blank",
  "data": {
    "text": "_____ días, ¿cómo está usted?",
    "blanks": [
      {
        "position": 0,
        "correct_answers": ["Buenos", "buenos"],
        "hints": ["greeting", "good"]
      }
    ]
  }
}
```

**Request Body (VOF Exercise):**
```json
{
  "id": "greeting-vof-2",
  "exercise_type": "vof",
  "data": {
    "statement": "Buenos días is used only in the morning",
    "is_true": true,
    "explanation": "Buenos días is specifically used as a morning greeting"
  }
}
```

**Request Body (Pairs Exercise):**
```json
{
  "id": "greeting-pairs-1",
  "exercise_type": "pairs",
  "data": {
    "pairs": [
      {
        "left": "Hello",
        "right": "Hola"
      },
      {
        "left": "Good morning",
        "right": "Buenos días"
      },
      {
        "left": "Good evening",
        "right": "Buenas noches"
      }
    ]
  }
}
```

**Request Body (Informative Exercise):**
```json
{
  "id": "greeting-info-1",
  "exercise_type": "informative",
  "data": {
    "title": "Spanish Greetings",
    "content": "In Spanish-speaking countries, greetings are very important and vary depending on the time of day and level of formality."
  }
}
```

**Request Body (Ordering Exercise):**
```json
{
  "id": "greeting-order-1",
  "exercise_type": "ordering",
  "data": {
    "items": [
      {
        "text": "Hola",
        "correct_order": 1
      },
      {
        "text": "me",
        "correct_order": 2
      },
      {
        "text": "llamo",
        "correct_order": 3
      },
      {
        "text": "María",
        "correct_order": 4
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "greeting-trans-3",
    "exercise_type": "translation",
    "data": {
      "source_text": "Good evening",
      "target_text": "Buenas noches",
      "hints": ["greeting", "time", "evening"]
    },
    "created_at": "2023-07-20T12:34:56.789Z",
    "updated_at": "2023-07-20T12:34:56.789Z"
  }
}
```

#### Get Exercise by ID
**GET /api/exercises/:id**

Get detailed information about a specific exercise.

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "greeting-trans-1",
    "exercise_type": "translation",
    "data": {
      "source_text": "Hello",
      "target_text": "Hola",
      "hints": ["greeting", "common"]
    },
    "created_at": "2023-07-01T00:00:00.000Z",
    "updated_at": "2023-07-01T00:00:00.000Z"
  }
}
```

#### Update Exercise
**PUT /api/exercises/:id**

Update an existing exercise.

**Authorization:** Admin or Content Creator role required

**Request Body:**
```json
{
  "data": {
    "source_text": "Hello there",
    "target_text": "Hola",
    "hints": ["greeting", "common", "informal"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "id": "greeting-trans-1",
    "exercise_type": "translation",
    "data": {
      "source_text": "Hello there",
      "target_text": "Hola",
      "hints": ["greeting", "common", "informal"]
    },
    "created_at": "2023-07-01T00:00:00.000Z",
    "updated_at": "2023-07-20T12:34:56.789Z"
  }
}
```

#### Delete Exercise
**DELETE /api/exercises/:id**

Delete an exercise. Note: This will fail if the exercise is currently assigned to any lessons.

**Authorization:** Admin role required

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "message": "Exercise deleted successfully"
}
```

#### Get Exercises by Type
**GET /api/exercises/type/:type**

Get all exercises of a specific type.

**Path Parameters:**
- `type`: Exercise type (translation/fill-in-the-blank/vof/pairs/informative/ordering)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Field to sort by (default: created_at)
- `sortOrder` (optional): Sort order (asc/desc, default: desc)

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": [
    {
      "id": "greeting-trans-1",
      "exercise_type": "translation",
      "data": {
        "source_text": "Hello",
        "target_text": "Hola",
        "hints": ["greeting", "common"]
      },
      "created_at": "2023-07-01T00:00:00.000Z",
      "updated_at": "2023-07-01T00:00:00.000Z"
    },
    {
      "id": "greeting-trans-2",
      "exercise_type": "translation",
      "data": {
        "source_text": "Good morning",
        "target_text": "Buenos días",
        "hints": ["greeting", "time"]
      },
      "created_at": "2023-07-01T00:00:00.000Z",
      "updated_at": "2023-07-01T00:00:00.000Z"
    }
  ]
}
```

## Data Types Reference

### Module Types
- `informative`: Information-only content
- `basic_lesson`: Standard lesson with exercises
- `reading`: Reading comprehension module
- `dialogue`: Conversation-based module
- `exam`: Assessment module

### Exercise Types
- `translation`: Translate text from source to target language
- `fill-in-the-blank`: Complete sentences with missing words
- `vof`: True or False questions (Verdadero o Falso)
- `pairs`: Match items from two columns
- `informative`: Display information content
- `ordering`: Arrange items in correct order

### Exercise Data Structures

#### Translation Exercise Data
```json
{
  "source_text": "Text to translate",
  "target_text": "Correct translation",
  "hints": ["optional", "hint", "array"]
}
```

#### Fill-in-the-blank Exercise Data
```json
{
  "text": "Text with _____ blanks",
  "blanks": [
    {
      "position": 0,
      "correct_answers": ["answer1", "answer2"],
      "hints": ["optional", "hints"]
    }
  ]
}
```

#### VOF Exercise Data
```json
{
  "statement": "Statement to evaluate",
  "is_true": true,
  "explanation": "Optional explanation"
}
```

#### Pairs Exercise Data
```json
{
  "pairs": [
    {
      "left": "Left item",
      "right": "Right item"
    }
  ]
}
```

#### Informative Exercise Data
```json
{
  "title": "Optional title",
  "content": "Information content to display"
}
```

#### Ordering Exercise Data
```json
{
  "items": [
    {
      "text": "Item text",
      "correct_order": 1
    }
  ]
}
```

### User Roles
- `student`: Regular learner with basic access
- `content_creator`: Can create and edit content
- `admin`: Full system access including user management

### Language Codes
All language codes follow ISO 639-1 standard (2-letter codes):
- `en`: English
- `es`: Spanish
- `fr`: French
- `de`: German
- `it`: Italian
- `pt`: Portuguese
- And more...
## Progr
ess Tracking Endpoints

The Progress Tracking system manages user learning progress, experience points, lesson completions, and gamification features like streaks and lives. All endpoints require authentication unless otherwise specified.

### Get Current User Progress
**GET /api/progress**

Get the current authenticated user's progress information including experience points, lives, streak, and last completed lesson.

**Authorization:** Authenticated User Required

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "experience_points": 1250,
    "lives_current": 4,
    "streak_current": 7,
    "last_completed_lesson_id": "en-es-basic-level1-section1-module1-lesson3",
    "last_activity_date": "2023-07-20T10:30:00.000Z",
    "updated_at": "2023-07-20T12:34:56.789Z"
  }
}
```

### Get Progress Summary
**GET /api/progress/summary**

Get a comprehensive summary of the user's learning progress including statistics about completed lessons and courses.

**Authorization:** Authenticated User Required

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "experience_points": 1250,
    "lives_current": 4,
    "streak_current": 7,
    "lessons_completed": 45,
    "courses_started": 2,
    "courses_completed": 1,
    "last_activity_date": "2023-07-20T10:30:00.000Z"
  }
}
```

### Complete a Lesson
**POST /api/progress/lesson/:id**

Mark a lesson as completed and update the user's progress. Awards experience points based on performance and updates streak information.

**Authorization:** Authenticated User Required

**Request Body:**
```json
{
  "score": 85,
  "time_spent_seconds": 120
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "progress": {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "experience_points": 1261,
      "lives_current": 4,
      "streak_current": 8,
      "last_completed_lesson_id": "en-es-basic-level1-section1-module1-lesson4",
      "last_activity_date": "2023-07-20T12:34:56.789Z",
      "updated_at": "2023-07-20T12:34:56.789Z"
    },
    "completion": {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "lesson_id": "en-es-basic-level1-section1-module1-lesson4",
      "completed_at": "2023-07-20T12:34:56.789Z",
      "score": 85,
      "time_spent_seconds": 120
    },
    "experience_gained": 11
  },
  "message": "Lesson completed successfully"
}
```

### Check Lesson Completion Status
**GET /api/progress/lesson/:id/completed**

Check if a specific lesson has been completed by the current user.

**Authorization:** Authenticated User Required

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "lesson_id": "en-es-basic-level1-section1-module1-lesson4",
    "is_completed": true
  }
}
```

### Get User Lesson Completions
**GET /api/progress/completions**

Get a paginated list of all lessons completed by the current user.

**Authorization:** Authenticated User Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Field to sort by (default: completedAt)
- `sortOrder` (optional): Sort order (asc/desc, default: desc)

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": [
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "lesson_id": "en-es-basic-level1-section1-module1-lesson4",
      "completed_at": "2023-07-20T12:34:56.789Z",
      "score": 85,
      "time_spent_seconds": 120
    },
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "lesson_id": "en-es-basic-level1-section1-module1-lesson3",
      "completed_at": "2023-07-20T10:30:00.000Z",
      "score": 92,
      "time_spent_seconds": 95
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Synchronize Offline Progress
**PUT /api/progress/sync**

Synchronize progress data that was collected while offline. Handles conflict resolution for duplicate completions based on timestamps.

**Authorization:** Authenticated User Required

**Request Body:**
```json
{
  "completions": [
    {
      "lesson_id": "en-es-basic-level1-section1-module1-lesson5",
      "completed_at": "2023-07-20T08:15:00.000Z",
      "score": 78,
      "time_spent_seconds": 145
    },
    {
      "lesson_id": "en-es-basic-level1-section1-module1-lesson6",
      "completed_at": "2023-07-20T08:45:00.000Z",
      "score": 91,
      "time_spent_seconds": 110
    }
  ],
  "last_sync_timestamp": "2023-07-20T07:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "synced_completions": 2,
    "skipped_duplicates": 0,
    "updated_progress": {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "experience_points": 1280,
      "lives_current": 4,
      "streak_current": 8,
      "last_completed_lesson_id": "en-es-basic-level1-section1-module1-lesson6",
      "last_activity_date": "2023-07-20T12:34:56.789Z",
      "updated_at": "2023-07-20T12:34:56.789Z"
    }
  },
  "message": "Synchronized 2 completions, skipped 0 duplicates"
}
```

### Update User Progress
**PUT /api/progress**

Manually update user progress information. This endpoint allows for direct modification of experience points, lives, streak, and last completed lesson.

**Authorization:** Authenticated User Required

**Request Body:**
```json
{
  "experience_points": 1500,
  "lives_current": 5,
  "streak_current": 10,
  "last_completed_lesson_id": "en-es-basic-level1-section2-module1-lesson1"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "experience_points": 1500,
    "lives_current": 5,
    "streak_current": 10,
    "last_completed_lesson_id": "en-es-basic-level1-section2-module1-lesson1",
    "last_activity_date": "2023-07-20T12:34:56.789Z",
    "updated_at": "2023-07-20T12:34:56.789Z"
  },
  "message": "Progress updated successfully"
}
```

### Update User Lives
**PUT /api/progress/lives**

Update the user's current lives count for gamification purposes. Lives can be increased or decreased.

**Authorization:** Authenticated User Required

**Request Body:**
```json
{
  "lives_change": -1
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "experience_points": 1500,
    "lives_current": 4,
    "streak_current": 10,
    "last_completed_lesson_id": "en-es-basic-level1-section2-module1-lesson1",
    "last_activity_date": "2023-07-20T12:34:56.789Z",
    "updated_at": "2023-07-20T12:34:56.789Z"
  },
  "message": "Lives updated successfully"
}
```

### Award Bonus Experience Points (Admin Only)
**POST /api/progress/bonus**

Award bonus experience points to a specific user. This is an administrative function for special events or corrections.

**Authorization:** Admin Role Required

**Request Body:**
```json
{
  "target_user_id": "550e8400-e29b-41d4-a716-446655440000",
  "bonus_points": 100,
  "reason": "Participation in community event"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "experience_points": 1600,
    "lives_current": 4,
    "streak_current": 10,
    "last_completed_lesson_id": "en-es-basic-level1-section2-module1-lesson1",
    "last_activity_date": "2023-07-20T12:34:56.789Z",
    "updated_at": "2023-07-20T12:34:56.789Z"
  },
  "message": "Awarded 100 bonus experience points"
}
```

### Reset User Progress (Admin Only)
**POST /api/progress/reset**

Reset a user's progress to initial state. This is an administrative function that should be used with caution.

**Authorization:** Admin Role Required

**Request Body:**
```json
{
  "target_user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "experience_points": 0,
    "lives_current": 5,
    "streak_current": 0,
    "last_completed_lesson_id": null,
    "last_activity_date": "2023-07-20T12:34:56.789Z",
    "updated_at": "2023-07-20T12:34:56.789Z"
  },
  "message": "User progress reset successfully"
}
```

### Get Lesson Completion Statistics (Admin/Content Creator)
**GET /api/progress/lesson/:id/stats**

Get statistical information about a specific lesson's completion rates and performance. This endpoint is useful for content creators and administrators to analyze lesson difficulty and engagement.

**Authorization:** Admin or Content Creator Role Required

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    "total_completions": 1247,
    "average_score": 82.5,
    "average_time_spent": 135.7
  }
}
```

## Progress Tracking Features

### Experience Points System
- **Base Points**: Each lesson has a base experience point value
- **Performance Multipliers**:
  - 90%+ score: +20% bonus experience
  - 80-89% score: +10% bonus experience  
  - 60-79% score: No modifier
  - <60% score: -20% experience reduction
- **Minimum Award**: At least 1 experience point is always awarded

### Streak Tracking
- **Daily Activity**: Streak increments when lessons are completed on consecutive days
- **Same Day**: Multiple completions on the same day maintain the current streak
- **Streak Break**: Missing a day resets the streak to 1 on the next completion
- **Automatic Calculation**: Streaks are calculated based on the `last_activity_date`

### Lives System (Gamification)
- **Default Lives**: Users start with 5 lives
- **Range**: Lives are capped between 0 and 10
- **Usage**: Lives can be decremented for incorrect answers or incremented as rewards
- **Manual Control**: Lives can be adjusted through the API for game mechanics

### Offline Synchronization
- **Conflict Resolution**: Duplicate completions are detected and skipped
- **Timestamp-Based**: More recent completions take precedence
- **Batch Processing**: Multiple completions can be synchronized in a single request
- **Experience Accumulation**: All synchronized completions contribute to total experience

### Data Validation
- **Score Range**: Scores must be between 0 and 100
- **Time Tracking**: Time spent is recorded in seconds (non-negative integers)
- **Lesson Validation**: All lesson IDs are validated against the content database
- **User Authentication**: All operations require valid user authentication

### Error Handling
- **Duplicate Completions**: Returns 409 Conflict if lesson already completed
- **Invalid Lessons**: Returns 404 Not Found for non-existent lessons
- **Permission Errors**: Returns 403 Forbidden for insufficient permissions
- **Validation Errors**: Returns 400 Bad Request with detailed error messages