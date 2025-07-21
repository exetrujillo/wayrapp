# Progress Tracking Endpoints

The Progress Tracking system manages user learning progress, experience points, lesson completions, and gamification features like streaks and lives. All endpoints require authentication unless otherwise specified.

## Get Current User Progress
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

## Get Progress Summary
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

## Complete a Lesson
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

## Check Lesson Completion Status
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

## Get User Lesson Completions
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
  ]
}
```

## Synchronize Offline Progress
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

## Update User Progress
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

## Update User Lives
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

## Award Bonus Experience Points (Admin Only)
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

## Reset User Progress (Admin Only)
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

## Get Lesson Completion Statistics (Admin/Content Creator)
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

## User Roles and Language Codes

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