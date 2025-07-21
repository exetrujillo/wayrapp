---
layout: default
title: Packaged Content API
---

# Packaged Content API for Offline Support

This document describes the implementation of the Packaged Content API feature for WayrApp backend, which provides offline-first functionality with efficient caching and versioning support.

## Overview

The Packaged Content API allows clients to download complete course content in a single optimized request, enabling offline functionality and reducing the number of API calls needed to fetch hierarchical content.

## Features Implemented

### 1. Packaged Course Endpoint with Nested Content Retrieval

- **Endpoint**: `GET /api/courses/{id}/package`
- **Description**: Returns a complete course with all nested content (levels, sections, modules, lessons, exercises) in a single JSON response
- **Authentication**: No authentication required (public endpoint)
- **Response Format**: Hierarchical JSON structure with all related entities

### 2. Versioning Support with Last Updated Timestamps

- **Package Version**: Each packaged course includes a `package_version` timestamp
- **Hierarchical Versioning**: The package version is calculated from the most recent update across the entire content hierarchy
- **If-Modified-Since Support**: Clients can send `If-Modified-Since` header to check for updates
- **304 Not Modified**: Returns HTTP 304 when content hasn't been modified since the client's version

### 3. Efficient Database Queries

- **Single Query Approach**: Uses Prisma's nested include to fetch all related data in one database query
- **Optimized Joins**: Leverages database relationships to minimize query complexity
- **Ordered Results**: All nested collections are ordered by their `order` field for consistent presentation

### 4. Caching Strategy

- **In-Memory Cache**: Implements a custom in-memory cache service with TTL support
- **15-minute Cache**: Packaged courses are cached for 15 minutes due to their size and complexity
- **Cache Invalidation**: Automatic cache invalidation when any content in the hierarchy is modified
- **Cache Keys**: Structured cache keys for easy identification and management

## API Usage

### Basic Request

```http
GET /api/courses/es-en-beginner/package
```

### Conditional Request (Check for Updates)

```http
GET /api/courses/es-en-beginner/package
If-Modified-Since: Wed, 21 Oct 2024 07:28:00 GMT
```

### Response Headers

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, max-age=900
Last-Modified: Thu, 22 Oct 2024 10:30:00 GMT
ETag: "2024-10-22T10:30:00.000Z"
```

### Response Structure

```json
{
  "data": {
    "course": {
      "id": "es-en-beginner",
      "source_language": "es",
      "target_language": "en",
      "name": "Spanish for Beginners",
      "description": "Learn basic Spanish vocabulary and grammar",
      "is_public": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:45:00Z"
    },
    "levels": [
      {
        "id": "es-en-beginner-level-1",
        "course_id": "es-en-beginner",
        "code": "L1",
        "name": "Basic Greetings",
        "order": 1,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-16T09:15:00Z",
        "sections": [
          {
            "id": "es-en-beginner-level-1-section-1",
            "level_id": "es-en-beginner-level-1",
            "name": "Hello and Goodbye",
            "order": 1,
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-16T11:20:00Z",
            "modules": [
              {
                "id": "es-en-beginner-level-1-section-1-module-1",
                "section_id": "es-en-beginner-level-1-section-1",
                "module_type": "basic_lesson",
                "name": "Common Greetings",
                "order": 1,
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-17T08:45:00Z",
                "lessons": [
                  {
                    "id": "es-en-beginner-level-1-section-1-module-1-lesson-1",
                    "module_id": "es-en-beginner-level-1-section-1-module-1",
                    "experience_points": 10,
                    "order": 1,
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-18T14:30:00Z",
                    "exercises": [
                      {
                        "lesson_id": "es-en-beginner-level-1-section-1-module-1-lesson-1",
                        "exercise_id": "greet-trans-001",
                        "order": 1,
                        "exercise": {
                          "id": "greet-trans-001",
                          "exercise_type": "translation",
                          "data": {
                            "source_text": "Hello, how are you?",
                            "target_text": "Hola, ¿cómo estás?",
                            "hints": ["greeting", "question"]
                          },
                          "created_at": "2024-01-15T10:30:00Z",
                          "updated_at": "2024-01-19T16:20:00Z"
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    "package_version": "2024-01-20T14:45:00.000Z"
  },
  "success": true,
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

## Implementation Details

### Cache Service

The cache service provides:
- **TTL Support**: Automatic expiration of cached entries
- **Memory Management**: Periodic cleanup of expired entries
- **Statistics**: Cache hit/miss tracking and size monitoring
- **Type Safety**: Generic type support for cached values

### Cache Invalidation

Cache invalidation occurs automatically when:
- Course is created, updated, or deleted
- Level is created, updated, or deleted
- Section is created, updated, or deleted
- Module is created, updated, or deleted
- Lesson is created, updated, or deleted (when implemented)
- Exercise is created, updated, or deleted (when implemented)

### Performance Considerations

- **Database Optimization**: Single query with nested includes
- **Memory Usage**: 15-minute cache TTL balances performance and memory usage
- **Network Efficiency**: Reduces multiple API calls to a single request
- **Client-Side Caching**: HTTP caching headers enable browser/client caching

## Testing

The implementation includes comprehensive tests:

### Unit Tests
- Cache service functionality
- TTL and expiration behavior
- Cache statistics and cleanup

### Integration Tests
- Packaged course generation
- Versioning and conditional requests
- Cache invalidation scenarios

### Controller Tests
- HTTP response headers
- Status code handling
- Error scenarios

## Requirements Satisfied

✅ **Requirement 10.1**: Packaged endpoint returns all nested content in a single optimized JSON object  
✅ **Requirement 10.2**: Package includes version/timestamp for client update checking  
✅ **Requirement 10.3**: Logical separation of Core Platform Data from Content Data maintained  

## Future Enhancements

1. **Redis Integration**: Replace in-memory cache with Redis for distributed caching
2. **Compression**: Add gzip compression for large packaged responses
3. **Partial Updates**: Support for delta updates to reduce bandwidth
4. **Background Refresh**: Proactive cache warming for popular courses
5. **Metrics**: Add monitoring and analytics for cache performance

## Usage Examples

### Client-Side Implementation

```javascript
// Initial download
const response = await fetch('/api/courses/es-en-beginner/package');
const packagedCourse = await response.json();
localStorage.setItem('course-es-en-beginner', JSON.stringify(packagedCourse));
localStorage.setItem('course-es-en-beginner-version', packagedCourse.data.package_version);

// Check for updates
const lastVersion = localStorage.getItem('course-es-en-beginner-version');
const updateResponse = await fetch('/api/courses/es-en-beginner/package', {
  headers: {
    'If-Modified-Since': new Date(lastVersion).toUTCString()
  }
});

if (updateResponse.status === 304) {
  console.log('Course is up to date');
} else {
  const updatedCourse = await updateResponse.json();
  localStorage.setItem('course-es-en-beginner', JSON.stringify(updatedCourse));
  localStorage.setItem('course-es-en-beginner-version', updatedCourse.data.package_version);
}
```

This implementation provides a robust foundation for offline-first functionality while maintaining excellent performance and user experience.