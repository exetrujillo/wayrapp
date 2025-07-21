---
layout: default
title: Content Management
---

# Content Management Endpoints

## Courses

### Get All Courses
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

### Create Course
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

### Get Course by ID
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

### Update Course
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

### Delete Course
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

### Get Packaged Course
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

## Levels

### Get Levels by Course
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

### Create Level
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

### Get Level by ID
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

### Update Level
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

### Delete Level
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

## Sections

### Get Sections by Level
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

### Create Section
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

### Get Section by ID
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

### Update Section
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

### Delete Section
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

## Modules

### Get Modules by Section
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

### Create Module
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

### Get Module by ID
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

### Update Module
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

### Delete Module
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