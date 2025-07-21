# Lessons & Exercises Management

## Lessons

### Get Lessons by Module
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

### Create Lesson
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

### Get Lesson by ID
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

### Update Lesson
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

### Delete Lesson
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

## Lesson-Exercise Relationships

### Get Lesson Exercises
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

### Assign Exercise to Lesson
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

### Unassign Exercise from Lesson
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

### Reorder Lesson Exercises
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

## Exercises

### Get All Exercises
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

### Create Exercise
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

### Get Exercise by ID
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

### Update Exercise
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

### Delete Exercise
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

### Get Exercises by Type
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