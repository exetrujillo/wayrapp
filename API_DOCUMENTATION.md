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

## Data Types Reference

### Module Types
- `informative`: Information-only content
- `basic_lesson`: Standard lesson with exercises
- `reading`: Reading comprehension module
- `dialogue`: Conversation-based module
- `exam`: Assessment module

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