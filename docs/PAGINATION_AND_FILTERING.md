---
layout: default
title: Pagination and Filtering Guide
---

# Pagination and Filtering Guide

This document explains the pagination and filtering capabilities of the WayrApp API.

## Pagination

The API supports two pagination strategies:

### 1. Page-Based Pagination (Traditional)

```
GET /api/v1/courses?page=2&limit=20
```

Parameters:
- `page`: Page number (starts at 1)
- `limit`: Number of items per page (default: 20, max: 100)

### 2. Offset-Based Pagination

```
GET /api/v1/courses?offset=40&limit=20
```

Parameters:
- `offset`: Number of items to skip
- `limit`: Number of items to return (default: 20, max: 100)

### Pagination Response Headers

The API includes pagination metadata in the response headers:

```
X-Total-Count: 100
X-Total-Pages: 5
X-Current-Page: 2
X-Has-Next: true
X-Has-Prev: true
X-Limit: 20
X-Offset: 20
X-Next-Offset: 40
X-Prev-Offset: 0
```

Additionally, the API provides navigation links using the Link header (RFC 5988):

```
Link: <api/v1/courses?offset=40&limit=20>; rel="next", 
      <api/v1/courses?offset=0&limit=20>; rel="prev", 
      <api/v1/courses?offset=0&limit=20>; rel="first", 
      <api/v1/courses?offset=80&limit=20>; rel="last"
```

## Sorting

All list endpoints support sorting:

```
GET /api/v1/courses?sortBy=name&sortOrder=asc
```

Parameters:
- `sortBy`: Field to sort by (allowed fields vary by endpoint)
- `sortOrder`: Either `asc` or `desc` (default varies by endpoint)

### Allowed Sort Fields

- **Courses**: `created_at`, `updated_at`, `name`, `source_language`, `target_language`
- **Levels**: `order`, `created_at`, `updated_at`, `name`, `code`
- **Sections**: `order`, `created_at`, `updated_at`, `name`
- **Modules**: `order`, `created_at`, `updated_at`, `name`, `module_type`
- **Lessons**: `order`, `created_at`, `updated_at`, `experience_points`
- **Exercises**: `created_at`, `updated_at`, `exercise_type`
- **Users**: `created_at`, `updated_at`, `email`, `username`, `role`, `registration_date`
- **Progress**: `last_activity_date`, `experience_points`, `streak_current`

## Filtering

The API supports various filtering options depending on the endpoint:

### Text Search

```
GET /api/v1/courses?search=Spanish
```

The `search` parameter performs a case-insensitive search across relevant text fields for each entity type.

#### Advanced Search Features

- **Exact Phrase Search**: Use quotes for exact phrase matching
  ```
  GET /api/v1/courses?search="Spanish for Beginners"
  ```

- **Multi-Term Search**: Space-separated terms are treated as AND conditions
  ```
  GET /api/v1/courses?search=Spanish beginner
  ```

### Field-Specific Filters

Each endpoint supports specific filters:

#### Courses
```
GET /api/v1/courses?source_language=es&target_language=en&is_public=true
```

#### Modules
```
GET /api/v1/sections/{sectionId}/modules?module_type=basic_lesson
```

### Date Range Filtering

Some endpoints support date range filtering:

```
GET /api/v1/users?registration_date_start=2023-01-01&registration_date_end=2023-12-31
```

### Numeric Range Filtering

```
GET /api/v1/lessons?experience_points_min=10&experience_points_max=50
```

## Performance Optimization

The API includes several performance optimizations:

1. **Database Indexes**: Optimized indexes for all commonly queried fields
2. **Child Entity Counts**: Hierarchical data includes child entity counts to reduce API calls
3. **Query Parameter Validation**: All query parameters are validated to prevent inefficient queries
4. **Connection Pooling**: Database connections are pooled for optimal performance
5. **Caching Headers**: Appropriate caching headers for improved client-side caching

## Examples

### List all Spanish courses with pagination
```
GET /api/v1/courses?source_language=es&limit=10&page=1
```

### Get all beginner levels sorted by order
```
GET /api/v1/courses/{courseId}/levels?search=beginner&sortBy=order&sortOrder=asc
```

### Get modules of a specific type with offset pagination
```
GET /api/v1/sections/{sectionId}/modules?module_type=reading&offset=20&limit=10
```