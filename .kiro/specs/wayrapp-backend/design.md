# Design Document

## Overview

The WayrApp backend is designed as a modular, TypeScript-based RESTful API using Node.js and Express, serving as the core component of the WayrApp monorepo ecosystem. The system follows a feature-based modular architecture that separates Core Platform Data (users, progress) from Content Data (courses, lessons) to support future decentralization. The API connects to a PostgreSQL database hosted on Neon and implements JWT-based authentication with role-based access control.

**Monorepo Context**: This backend API serves multiple frontend applications within the same repository:
- Content Creator web application (React/Vite)
- Mobile learning application (React Native/Expo)
- Shared components and utilities library

### Key Design Principles

- **Modular Architecture**: Feature-based organization (content, users, progress modules)
- **Type Safety**: Full TypeScript implementation with strict typing
- **Security First**: JWT authentication, RBAC, input validation, and vulnerability protection
- **Offline-First Support**: Packaged content endpoints with versioning
- **Scalability**: Connection pooling, pagination, and microservices-ready structure

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Mobile App     │    │ Content Creator │    │  External Apps  │
│ (React Native)  │    │   (React/Vite)  │    │   (Third-party) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │   Backend API    │
                    │ (Node.js/Express)│
                    └──────────────────┘
                    │  Express API    │
                    │  (Node.js +     │
                    │   TypeScript)   │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   (Neon Cloud)  │
                    └─────────────────┘
```

### Module Structure

```
src/
├── modules/
│   ├── content/           # Content management module
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   └── routes/
│   ├── users/            # User management module
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   └── routes/
│   └── progress/         # Progress tracking module
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── models/
│       └── routes/
├── shared/               # Shared utilities and middleware
│   ├── middleware/
│   ├── utils/
│   ├── types/
│   └── database/
└── app.ts               # Application entry point
```

## Components and Interfaces

### Core Interfaces

#### Content Module Interfaces

```typescript
// Base content entity interface
interface BaseContentEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

// Hierarchical content interfaces aligned with production schema
interface Course extends BaseContentEntity {
  id: string; // VARCHAR(20)
  source_language: string; // VARCHAR(20) - BCP 47 language tag (e.g., 'en', 'es-ES', 'qu' for Quechua, 'aym' for Aymara)
  target_language: string; // VARCHAR(20) - BCP 47 language tag (e.g., 'en', 'es-ES', 'qu' for Quechua, 'aym' for Aymara)
  name: string; // VARCHAR(100)
  description?: string;
  is_public: boolean;
  levels_count?: number; // Summary for child entities
}

interface Level extends BaseContentEntity {
  id: string; // VARCHAR(30)
  course_id: string; // VARCHAR(20)
  code: string; // VARCHAR(10)
  name: string; // VARCHAR(100)
  order: number;
  sections_count?: number;
}

interface Section extends BaseContentEntity {
  id: string; // VARCHAR(40)
  level_id: string; // VARCHAR(30)
  name: string; // VARCHAR(150)
  order: number;
  modules_count?: number;
}

interface Module extends BaseContentEntity {
  id: string; // VARCHAR(50)
  section_id: string; // VARCHAR(40)
  module_type: 'informative' | 'basic_lesson' | 'reading' | 'dialogue' | 'exam';
  name: string; // VARCHAR(150)
  order: number;
  lessons_count?: number;
}

interface Lesson extends BaseContentEntity {
  id: string; // VARCHAR(60)
  module_id: string; // VARCHAR(50)
  experience_points: number;
  order: number;
  exercises?: LessonExercise[]; // Many-to-many relationship
}

interface Exercise extends BaseContentEntity {
  id: string; // VARCHAR(15)
  exercise_type: 'translation' | 'fill-in-the-blank' | 'vof' | 'pairs' | 'informative' | 'ordering';
  data: any; // JSONB - flexible exercise data structure
}

interface LessonExercise {
  lesson_id: string;
  exercise_id: string;
  order: number;
  exercise?: Exercise; // Populated exercise data
}

// Exercise data type examples
interface TranslationExerciseData {
  source_text: string;
  target_text: string;
  hints?: string[];
}

interface FillInTheBlankExerciseData {
  text: string;
  blanks: Array<{
    position: number;
    correct_answers: string[];
    hints?: string[];
  }>;
}

interface VofExerciseData {
  statement: string;
  is_true: boolean;
  explanation?: string;
}
```

#### User Module Interfaces

```typescript
interface User {
  id: string; // UUID
  email: string; // VARCHAR(255)
  username?: string; // VARCHAR(50)
  passwordHash?: string; // VARCHAR(255) - Securely hashed password
  country_code?: string; // CHAR(2)
  registration_date: Date;
  last_login_date?: Date; // Track user login activity
  profile_picture_url?: string; // VARCHAR(255)
  is_active: boolean;
  role: 'student' | 'content_creator' | 'admin';
  created_at: Date;
  updated_at: Date;
}

interface Follow {
  follower_id: string;
  followed_id: string;
  created_at: Date;
}

interface RevokedToken {
  id: string; // UUID
  token: string; // VARCHAR(500)
  userId: string; // UUID - References User.id
  revokedAt: Date;
  expiresAt: Date;
}
```

#### Progress Module Interfaces

```typescript
interface UserProgress {
  user_id: string; // Primary key, references users.id
  experience_points: number;
  lives_current: number;
  streak_current: number;
  last_completed_lesson_id?: string; // VARCHAR(60)
  last_activity_date: Date;
  updated_at: Date;
}

interface LessonCompletion {
  user_id: string;
  lesson_id: string;
  completed_at: Date;
  score?: number;
  time_spent_seconds?: number;
}
```

### Service Layer Architecture

```typescript
// Generic repository interface
interface Repository<T> {
  create(entity: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<PaginatedResult<T>>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

// Service interface with business logic
interface ContentService {
  createCourse(data: CreateCourseDto): Promise<Course>;
  getCourseWithSummary(id: string): Promise<CourseWithSummary>;
  getPackagedCourse(id: string): Promise<PackagedCourse>;
  // ... other methods
}
```

## Data Models

### PostgreSQL Schema Design (Production-Ready)

```sql
-- Function and Trigger for automatic 'updated_at' timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table for Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    country_code CHAR(2),
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    last_login_date TIMESTAMPTZ,
    profile_picture_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'content_creator', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Revoked Tokens
CREATE TABLE revoked_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(500) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    revoked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_revoked_tokens_token ON revoked_tokens(token);
CREATE INDEX idx_revoked_tokens_user_id ON revoked_tokens(user_id);
CREATE INDEX idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Table for Follows (Social Graph)
CREATE TABLE follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, followed_id)
);
CREATE INDEX idx_follows_followed_id ON follows(followed_id);

-- Table for User Progress
CREATE TABLE user_progress (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    experience_points INT NOT NULL DEFAULT 0,
    lives_current INT NOT NULL DEFAULT 5,
    streak_current INT NOT NULL DEFAULT 0,
    last_completed_lesson_id VARCHAR(60) REFERENCES lessons(id) ON DELETE SET NULL,
    last_activity_date TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER set_timestamp_user_progress BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Hierarchical Content Tables --

CREATE TABLE courses (
    id VARCHAR(20) PRIMARY KEY,
    source_language VARCHAR(20) NOT NULL, -- BCP 47 language tag (supports ISO 639-2/3 codes like 'qu' for Quechua, 'aym' for Aymara, regional variants like 'es-ES', 'pt-BR')
    target_language VARCHAR(20) NOT NULL, -- BCP 47 language tag (supports ISO 639-2/3 codes like 'qu' for Quechua, 'aym' for Aymara, regional variants like 'es-ES', 'pt-BR')
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER set_timestamp_courses BEFORE UPDATE ON courses FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE levels (
    id VARCHAR(30) PRIMARY KEY,
    course_id VARCHAR(20) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    "order" INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (course_id, code),
    UNIQUE (course_id, "order")
);
CREATE TRIGGER set_timestamp_levels BEFORE UPDATE ON levels FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE sections (
    id VARCHAR(40) PRIMARY KEY,
    level_id VARCHAR(30) NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    "order" INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (level_id, "order")
);
CREATE TRIGGER set_timestamp_sections BEFORE UPDATE ON sections FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE modules (
    id VARCHAR(50) PRIMARY KEY,
    section_id VARCHAR(40) NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    module_type VARCHAR(30) NOT NULL CHECK (module_type IN ('informative', 'basic_lesson', 'reading', 'dialogue', 'exam')),
    name VARCHAR(150) NOT NULL,
    "order" INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (section_id, "order")
);
CREATE TRIGGER set_timestamp_modules BEFORE UPDATE ON modules FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE lessons (
    id VARCHAR(60) PRIMARY KEY,
    module_id VARCHAR(50) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    experience_points INT NOT NULL DEFAULT 10,
    "order" INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (module_id, "order")
);
CREATE TRIGGER set_timestamp_lessons BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE exercises (
    id VARCHAR(15) PRIMARY KEY,
    exercise_type VARCHAR(30) NOT NULL CHECK (exercise_type IN ('translation', 'fill-in-the-blank', 'vof', 'pairs', 'informative', 'ordering')),
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER set_timestamp_exercises BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE INDEX idx_exercises_type ON exercises(exercise_type);

CREATE TABLE lesson_exercises (
    lesson_id VARCHAR(60) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    exercise_id VARCHAR(15) NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    "order" INT NOT NULL,
    PRIMARY KEY (lesson_id, exercise_id)
);
```

### Prisma Schema Configuration

```prisma
// This is the Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                  String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email               String    @unique @db.VarChar(255)
  username            String?   @unique @db.VarChar(50)
  passwordHash        String?   @map("password_hash") @db.VarChar(255)
  countryCode         String?   @map("country_code") @db.Char(2)
  registrationDate    DateTime  @default(now()) @map("registration_date") @db.Timestamptz
  lastLoginDate       DateTime? @map("last_login_date") @db.Timestamptz
  profilePictureUrl   String?   @map("profile_picture_url") @db.VarChar(255)
  isActive            Boolean   @default(true) @map("is_active")
  role                Role      @default(student)
  createdAt           DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt           DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz
  
  // Relations
  progress            UserProgress?
  lessonCompletions   LessonCompletion[]
  following           Follow[] @relation("Follower")
  followers           Follow[] @relation("Followed")
  revokedTokens       RevokedToken[]
  
  // Performance optimization indexes
  @@index([role, isActive], map: "idx_users_role_active")
  @@index([registrationDate(sort: Desc)], map: "idx_users_registration_date")
  @@index([lastLoginDate(sort: Desc)], map: "idx_users_last_login")
  @@index([email], map: "idx_users_active_email", where: "is_active = true")
  @@index([username], map: "idx_users_active_username", where: "is_active = true AND username IS NOT NULL")
  @@map("users")
}

model Follow {
  followerId  String   @map("follower_id") @db.Uuid
  followedId  String   @map("followed_id") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  
  // Relations
  follower    User     @relation("Follower", fields: [followerId], references: [id], onDelete: Cascade)
  followed    User     @relation("Followed", fields: [followedId], references: [id], onDelete: Cascade)
  
  @@id([followerId, followedId])
  @@index([followedId])
  @@map("follows")
}

model UserProgress {
  userId                  String    @id @map("user_id") @db.Uuid
  experiencePoints        Int       @default(0) @map("experience_points")
  livesCurrent           Int       @default(5) @map("lives_current")
  streakCurrent          Int       @default(0) @map("streak_current")
  lastCompletedLessonId  String?   @map("last_completed_lesson_id") @db.VarChar(60)
  lastActivityDate       DateTime  @default(now()) @map("last_activity_date") @db.Timestamptz
  updatedAt              DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz
  
  // Relations
  user                   User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  lastCompletedLesson    Lesson?   @relation(fields: [lastCompletedLessonId], references: [id], onDelete: SetNull)
  
  // Performance optimization indexes
  @@index([experiencePoints(sort: Desc)], map: "idx_user_progress_exp_points")
  @@index([lastActivityDate(sort: Desc)], map: "idx_user_progress_activity")
  @@index([streakCurrent(sort: Desc)], map: "idx_user_progress_streak")
  @@map("user_progress")
}

model LessonCompletion {
  userId            String   @map("user_id") @db.Uuid
  lessonId          String   @map("lesson_id") @db.VarChar(60)
  completedAt       DateTime @map("completed_at") @db.Timestamptz
  score             Int?
  timeSpentSeconds  Int?     @map("time_spent_seconds")
  
  // Relations
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson            Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  @@id([userId, lessonId])
  @@index([userId])
  @@index([lessonId])
  @@index([completedAt])
  @@map("lesson_completions")
}

model Course {
  id             String   @id @db.VarChar(20)
  sourceLanguage String   @map("source_language") @db.VarChar(20) // BCP 47 language tag (supports 'qu', 'aym', 'es-ES', 'pt-BR')
  targetLanguage String   @map("target_language") @db.VarChar(20) // BCP 47 language tag (supports 'qu', 'aym', 'es-ES', 'pt-BR')
  name           String   @db.VarChar(100)
  description    String?
  isPublic       Boolean  @default(true) @map("is_public")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz
  
  // Relations
  levels         Level[]
  
  // Basic indexes
  @@index([sourceLanguage])
  @@index([targetLanguage])
  @@index([isPublic])
  @@index([createdAt])
  @@index([updatedAt])
  @@index([name])
  @@index([sourceLanguage, targetLanguage])
  
  // Performance optimization indexes
  @@index([sourceLanguage, targetLanguage, isPublic], map: "idx_courses_source_target_public")
  @@index([isPublic, createdAt(sort: Desc)], map: "idx_courses_public_created")
  @@index([name], map: "idx_courses_public_name", where: "is_public = true")
  @@index([sourceLanguage, targetLanguage], map: "idx_courses_public_languages", where: "is_public = true")
  @@map("courses")
}

model Level {
  id        String   @id @db.VarChar(30)
  courseId  String   @map("course_id") @db.VarChar(20)
  code      String   @db.VarChar(10)
  name      String   @db.VarChar(100)
  order     Int
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz
  
  // Relations
  course    Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  sections  Section[]
  
  @@unique([courseId, code])
  @@unique([courseId, order])
  @@index([courseId])
  @@index([createdAt])
  @@index([updatedAt])
  @@index([name])
  
  // Performance optimization indexes
  @@index([courseId, order], map: "idx_levels_course_order")
  @@index([courseId, createdAt(sort: Desc)], map: "idx_levels_course_created")
  @@map("levels")
}

model Section {
  id        String   @id @db.VarChar(40)
  levelId   String   @map("level_id") @db.VarChar(30)
  name      String   @db.VarChar(150)
  order     Int
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz
  
  // Relations
  level     Level     @relation(fields: [levelId], references: [id], onDelete: Cascade)
  modules   Module[]
  
  @@unique([levelId, order])
  @@index([levelId])
  @@index([createdAt])
  @@index([updatedAt])
  @@index([name])
  
  // Performance optimization indexes
  @@index([levelId, order], map: "idx_sections_level_order")
  @@index([levelId, createdAt(sort: Desc)], map: "idx_sections_level_created")
  @@map("sections")
}

model Module {
  id         String     @id @db.VarChar(50)
  sectionId  String     @map("section_id") @db.VarChar(40)
  moduleType ModuleType @map("module_type")
  name       String     @db.VarChar(150)
  order      Int
  createdAt  DateTime   @default(now()) @map("created_at") @db.Timestamptz
  updatedAt  DateTime   @default(now()) @updatedAt @map("updated_at") @db.Timestamptz
  
  // Relations
  section    Section    @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  lessons    Lesson[]
  
  @@unique([sectionId, order])
  @@index([sectionId])
  @@index([moduleType])
  @@index([createdAt])
  @@index([updatedAt])
  @@index([name])
  
  // Performance optimization indexes
  @@index([sectionId, order], map: "idx_modules_section_order")
  @@index([sectionId, moduleType], map: "idx_modules_section_type")
  @@index([sectionId, createdAt(sort: Desc)], map: "idx_modules_section_created")
  @@map("modules")
}

model Lesson {
  id               String    @id @db.VarChar(60)
  moduleId         String    @map("module_id") @db.VarChar(50)
  experiencePoints Int       @default(10) @map("experience_points")
  order            Int
  createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz
  
  // Relations
  module           Module           @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  exercises        LessonExercise[]
  userProgress     UserProgress[]
  completions      LessonCompletion[]
  
  @@unique([moduleId, order])
  @@index([moduleId])
  @@index([experiencePoints])
  @@index([createdAt])
  @@index([updatedAt])
  
  // Performance optimization indexes
  @@index([moduleId, order], map: "idx_lessons_module_order")
  @@index([moduleId, experiencePoints], map: "idx_lessons_module_exp")
  @@index([moduleId, createdAt(sort: Desc)], map: "idx_lessons_module_created")
  @@map("lessons")
}

model Exercise {
  id           String           @id @db.VarChar(15)
  exerciseType ExerciseType     @map("exercise_type")
  data         Json             @db.JsonB
  createdAt    DateTime         @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime         @default(now()) @updatedAt @map("updated_at") @db.Timestamptz
  
  // Relations
  lessons      LessonExercise[]
  
  @@index([exerciseType])
  
  // Performance optimization indexes
  @@index([exerciseType, createdAt(sort: Desc)], map: "idx_exercises_type_created")
  @@map("exercises")
}

model LessonExercise {
  lessonId   String   @map("lesson_id") @db.VarChar(60)
  exerciseId String   @map("exercise_id") @db.VarChar(15)
  order      Int
  
  // Relations
  lesson     Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  exercise   Exercise @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  
  @@id([lessonId, exerciseId])
  @@index([lessonId])
  @@index([exerciseId])
  @@map("lesson_exercises")
}

model RevokedToken {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  token     String   @unique @db.VarChar(500)
  userId    String   @map("user_id") @db.Uuid
  revokedAt DateTime @default(now()) @map("revoked_at") @db.Timestamptz
  expiresAt DateTime @map("expires_at") @db.Timestamptz
  
  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([userId])
  @@index([expiresAt])
  @@map("revoked_tokens")
}

enum Role {
  student
  content_creator
  admin
}

enum ModuleType {
  informative
  basic_lesson
  reading
  dialogue
  exam
}

enum ExerciseType {
  translation
  fill_in_the_blank @map("fill-in-the-blank")
  vof
  pairs
  informative
  ordering
}
```

## Error Handling

### Error Response Structure

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
  };
}

// Error codes
enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

### Global Error Handler

```typescript
interface ErrorHandler {
  handleValidationError(error: ValidationError): ApiError;
  handleAuthenticationError(error: AuthError): ApiError;
  handleDatabaseError(error: DatabaseError): ApiError;
  handleGenericError(error: Error): ApiError;
}
```

## Testing Strategy

### Testing Pyramid

1. **Unit Tests (70%)**
   - Service layer business logic
   - Utility functions
   - Data validation
   - Repository methods

2. **Integration Tests (20%)**
   - API endpoint testing
   - Database integration
   - Module interaction
   - Authentication flows

3. **End-to-End Tests (10%)**
   - Complete user workflows
   - Cross-module functionality
   - Performance testing

### Testing Tools and Frameworks

- **Jest**: Primary testing framework
- **Supertest**: API endpoint testing
- **Test Containers**: Database testing with real PostgreSQL
- **MSW (Mock Service Worker)**: External service mocking
- **Factory Pattern**: Test data generation

### Test Structure

```typescript
// Example test structure
describe('ContentService', () => {
  describe('createCourse', () => {
    it('should create a course with valid data', async () => {
      // Arrange
      const courseData = CourseFactory.build();
      
      // Act
      const result = await contentService.createCourse(courseData);
      
      // Assert
      expect(result).toMatchObject(courseData);
      expect(result.id).toBeDefined();
    });
    
    it('should throw validation error for invalid data', async () => {
      // Test validation scenarios
    });
  });
});
```
## API 
Design

### RESTful Endpoint Structure

#### Content Management Endpoints

```
# Courses
GET    /api/courses                    # List courses with pagination
POST   /api/courses                    # Create course (admin/content_creator)
GET    /api/courses/{id}               # Get course with summary
PUT    /api/courses/{id}               # Update course (admin/content_creator)
DELETE /api/courses/{id}               # Delete course (admin)
GET    /api/courses/{id}/package       # Get packaged course for offline

# Levels (nested under courses)
GET    /api/courses/{courseId}/levels          # List levels in course
POST   /api/courses/{courseId}/levels          # Create level
GET    /api/courses/{courseId}/levels/{id}     # Get level with summary
PUT    /api/courses/{courseId}/levels/{id}     # Update level
DELETE /api/courses/{courseId}/levels/{id}     # Delete level

# Sections (nested under levels)
GET    /api/levels/{levelId}/sections          # List sections in level
POST   /api/levels/{levelId}/sections          # Create section
GET    /api/levels/{levelId}/sections/{id}     # Get section with summary
PUT    /api/levels/{levelId}/sections/{id}     # Update section
DELETE /api/levels/{levelId}/sections/{id}     # Delete section

# Modules (nested under sections)
GET    /api/sections/{sectionId}/modules       # List modules in section
POST   /api/sections/{sectionId}/modules       # Create module
GET    /api/sections/{sectionId}/modules/{id}  # Get module with summary
PUT    /api/sections/{sectionId}/modules/{id}  # Update module
DELETE /api/sections/{sectionId}/modules/{id}  # Delete module

# Lessons (nested under modules)
GET    /api/modules/{moduleId}/lessons         # List lessons in module
POST   /api/modules/{moduleId}/lessons         # Create lesson
GET    /api/modules/{moduleId}/lessons/{id}    # Get lesson with exercises
PUT    /api/modules/{moduleId}/lessons/{id}    # Update lesson
DELETE /api/modules/{moduleId}/lessons/{id}    # Delete lesson

# Exercises (many-to-many with lessons)
GET    /api/exercises                          # List all exercises with pagination
POST   /api/exercises                          # Create reusable exercise
GET    /api/exercises/{id}                     # Get exercise by ID
PUT    /api/exercises/{id}                     # Update exercise
DELETE /api/exercises/{id}                     # Delete exercise

# Lesson-Exercise Management (Refined)
GET    /api/lessons/{lessonId}/exercises       # List exercises assigned to a lesson (with their order)
POST   /api/lessons/{lessonId}/exercises       # Assign an existing exercise to a lesson. Requires { exercise_id, order } in body
DELETE /api/lessons/{lessonId}/exercises/{exerciseId}        # Unassign an exercise from a lesson
PUT    /api/lessons/{lessonId}/exercises/reorder             # Reorder ALL exercises for a lesson. Expects an array of exercise IDs in the desired order in the body
```

#### User Management Endpoints

```
# Authentication
POST   /api/auth/register              # Register new user with secure password
POST   /api/auth/login                 # User login (JWT)
POST   /api/auth/refresh               # Refresh JWT token
POST   /api/auth/logout                # User logout (revokes refresh token)
GET    /api/auth/me                    # Get current authenticated user info

# Users
GET    /api/users/profile              # Get current user profile
PUT    /api/users/profile              # Update current user profile
PUT    /api/users/password             # Update user password (requires current password)
GET    /api/users                      # List users (admin only)
GET    /api/users/{id}                 # Get user by ID (admin only)
PUT    /api/users/{id}/role            # Update user role (admin only)
```

#### Progress Tracking Endpoints

```
# User Progress
GET    /api/progress                   # Get current user's progress
POST   /api/progress/lesson/{id}       # Mark lesson as completed
PUT    /api/progress/sync              # Sync offline progress data

# Progress Analytics (admin/content_creator)
GET    /api/analytics/progress         # Get aggregated progress data
GET    /api/analytics/courses/{id}     # Get course completion statistics
```

### Request/Response Examples

#### Create Course Request

```json
POST /api/courses
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "id": "qu-es-beginner",
  "source_language": "qu",
  "target_language": "es-ES",
  "name": "Quechua for Spanish Speakers",
  "description": "Learn basic Quechua vocabulary and grammar",
  "is_public": true
}
```

#### Course with Summary Response

```json
GET /api/courses/{id}

{
  "id": "aym-es-beginner",
  "source_language": "aym",
  "target_language": "es-ES",
  "name": "Aymara for Spanish Speakers",
  "description": "Learn basic Aymara vocabulary and grammar",
  "is_public": true,
  "levels_count": 5,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:45:00Z"
}
```

#### Packaged Course Response

```json
GET /api/courses/{id}/package

{
  "course": {
    "id": "pt-br-en-intermediate",
    "source_language": "pt-BR",
    "target_language": "en",
    "name": "Brazilian Portuguese for English Speakers",
    "is_public": true,
    "updated_at": "2024-01-20T14:45:00Z"
  },
  "levels": [
    {
      "id": "pt-br-en-intermediate-level-1",
      "code": "L1",
      "name": "Basic Greetings",
      "order": 1,
      "sections": [
        {
          "id": "pt-br-en-intermediate-level-1-section-1",
          "name": "Hello and Goodbye",
          "order": 1,
          "modules": [
            {
              "id": "pt-br-en-intermediate-level-1-section-1-module-1",
              "module_type": "basic_lesson",
              "name": "Common Greetings",
              "order": 1,
              "lessons": [
                {
                  "id": "pt-br-en-intermediate-level-1-section-1-module-1-lesson-1",
                  "experience_points": 10,
                  "order": 1,
                  "exercises": [
                    {
                      "exercise_id": "greet-trans-001",
                      "order": 1,
                      "exercise": {
                        "id": "greet-trans-001",
                        "exercise_type": "translation",
                        "data": {
                          "source_text": "Hello, how are you?",
                          "target_text": "Hola, ¿cómo estás?",
                          "hints": ["greeting", "question"]
                        }
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
  "package_version": "2024-01-20T14:45:00Z"
}
```

#### Create Exercise Request

```json
POST /api/exercises
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "id": "greet-trans-001",
  "exercise_type": "translation",
  "data": {
    "source_text": "Hello, how are you?",
    "target_text": "Hola, ¿cómo estás?",
    "hints": ["greeting", "question"]
  }
}
```

#### Assign Exercise to Lesson Request

```json
POST /api/lessons/{lessonId}/exercises
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "exercise_id": "greet-trans-001",
  "order": 1
}
```

## Security Implementation

### Authentication and Authorization System

#### Authentication Flow

1. **User Registration**
   - User submits email, password, and optional profile information
   - Password is validated for strength requirements
   - Password is hashed using bcrypt before storage
   - User is created with default 'student' role
   - JWT tokens (access and refresh) are generated and returned

2. **User Login**
   - User submits email and password
   - System retrieves user by email and verifies password hash
   - If valid, JWT tokens are generated and returned
   - Last login timestamp is updated

3. **Token Refresh**
   - Client submits refresh token
   - System verifies token validity and checks if it's been revoked
   - If valid, new access and refresh tokens are generated
   - Old refresh token remains valid until expiration

4. **User Logout**
   - Client submits refresh token with authenticated request
   - System adds token to revoked tokens list
   - Client is instructed to remove tokens from storage

#### Security Features

1. **Password Security**
   - Passwords are hashed using bcrypt with appropriate salt rounds
   - Password strength requirements enforced:
     - Minimum 8 characters
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one number
     - At least one special character

2. **JWT Token Security**
   - Access tokens expire after 15 minutes
   - Refresh tokens expire after 7 days
   - Tokens include user ID, email, and role
   - Refresh tokens can be revoked on logout
   - Expired tokens are automatically cleaned up

3. **Authorization Controls**
   - Role-based access control (RBAC) with three roles:
     - student: Basic access to courses and own progress
     - content_creator: Can create and update content
     - admin: Full system access
   - Permission-based access control for granular permissions
   - Resource ownership validation for user-specific resources

#### JWT Authentication Flow

```typescript
interface JWTPayload {
  sub: string;      // user ID
  email: string;
  role: string;
  iat: number;      // issued at
  exp: number;      // expiration
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthMiddleware {
  authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void>;
  requireRole(roles: string | string[]): MiddlewareFunction;
  requirePermission(permission: string): MiddlewareFunction;
  requireOwnership(userIdParam?: string): MiddlewareFunction;
  optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
}

// Token generation and validation
interface AuthUtils {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(payload: TokenPayload): string;
  generateTokenPair(payload: TokenPayload): TokenPair;
  verifyRefreshToken(token: string): JWTPayload;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
}

// Token blacklisting for logout
interface TokenBlacklistService {
  revokeToken(token: string, userId: string): Promise<void>;
  isTokenRevoked(token: string): Promise<boolean>;
  cleanupExpiredTokens(): Promise<number>;
}
```

### Role-Based Access Control

```typescript
// Permission matrix
const PERMISSIONS = {
  'student': [
    'read:courses',
    'read:own_progress',
    'update:own_progress',
    'update:own_profile'
  ],
  'content_creator': [
    ...PERMISSIONS.student,
    'create:content',
    'update:content',
    'read:analytics'
  ],
  'admin': [
    ...PERMISSIONS.content_creator,
    'delete:content',
    'manage:users',
    'read:all_progress'
  ]
};
```

### Input Validation with Zod

```typescript
import { z } from 'zod';

// Course validation schemas
const CreateCourseSchema = z.object({
  id: z.string().max(20),
  source_language: z.string().max(20), // BCP 47 language tag (supports ISO 639-2/3 codes like 'qu' for Quechua, 'aym' for Aymara, regional variants like 'es-ES', 'pt-BR')
  target_language: z.string().max(20), // BCP 47 language tag (supports ISO 639-2/3 codes like 'qu' for Quechua, 'aym' for Aymara, regional variants like 'es-ES', 'pt-BR')
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  is_public: z.boolean().default(true)
});

const CreateLevelSchema = z.object({
  id: z.string().max(30),
  course_id: z.string().max(20),
  code: z.string().max(10),
  name: z.string().min(1).max(100),
  order: z.number().int().positive()
});

const CreateExerciseSchema = z.object({
  id: z.string().max(15),
  exercise_type: z.enum(['translation', 'fill-in-the-blank', 'vof', 'pairs', 'informative', 'ordering']),
  data: z.object({}).passthrough() // Allow any JSONB structure
});

const AssignExerciseToLessonSchema = z.object({
  exercise_id: z.string().max(15),
  order: z.number().int().positive()
});

// User and Authentication validation schemas
const RegisterUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  country_code: z.string().length(2, 'Country code must be 2 characters').optional(),
  profile_picture_url: z.string().url('Invalid URL format').optional()
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const UpdateUserProfileSchema = z.object({
  username: z.string().max(50).optional(),
  country_code: z.string().length(2).optional(),
  profile_picture_url: z.string().max(255).url().optional()
});

const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
});

// Progress validation schemas
const UpdateProgressSchema = z.object({
  lesson_id: z.string().max(60),
  score: z.number().int().min(0).max(100).optional(),
  time_spent_seconds: z.number().int().min(0).optional()
});

type CreateCourseDto = z.infer<typeof CreateCourseSchema>;
type CreateLevelDto = z.infer<typeof CreateLevelSchema>;
type CreateExerciseDto = z.infer<typeof CreateExerciseSchema>;
type AssignExerciseToLessonDto = z.infer<typeof AssignExerciseToLessonSchema>;
type RegisterUserDto = z.infer<typeof RegisterUserSchema>;
type LoginDto = z.infer<typeof LoginSchema>;
type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
type UpdateUserProfileDto = z.infer<typeof UpdateUserProfileSchema>;
type UpdatePasswordDto = z.infer<typeof UpdatePasswordSchema>;
type UpdateProgressDto = z.infer<typeof UpdateProgressSchema>;
```

## Database Connection and ORM

### Database Configuration

```typescript
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  pool: {
    min: number;
    max: number;
    idle: number;
  };
}

// Connection pool setup
class DatabaseManager {
  private pool: Pool;
  
  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      ...config,
      ssl: config.ssl ? { rejectUnauthorized: false } : false
    });
  }
  
  async query<T>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const client = await this.pool.connect();
    try {
      return await client.query(text, params);
    } finally {
      client.release();
    }
  }
}
```

### Repository Pattern Implementation

```typescript
abstract class BaseRepository<T> {
  constructor(
    protected db: DatabaseManager,
    protected tableName: string
  ) {}
  
  async create(entity: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const fields = Object.keys(entity).join(', ');
    const values = Object.values(entity);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${fields})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.db.query<T>(query, values);
    return result.rows[0];
  }
  
  async findById(id: string): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query<T>(query, [id]);
    return result.rows[0] || null;
  }
  
  // Additional CRUD methods...
}
```

## Performance Considerations

### Caching Strategy

```typescript
interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  flush(): Promise<void>;
}

// Cache keys
const CACHE_KEYS = {
  COURSE: (id: string) => `course:${id}`,
  PACKAGED_COURSE: (id: string) => `packaged_course:${id}`,
  USER_PROGRESS: (userId: string) => `progress:${userId}`
};
```

### Query Optimization

- Use database indexes on frequently queried columns
- Implement pagination with limit/offset
- Use connection pooling for database connections
- Cache frequently accessed data (courses, packaged content)
- Implement database query logging for performance monitoring

### Monitoring and Logging

```typescript
interface Logger {
  info(message: string, meta?: object): void;
  warn(message: string, meta?: object): void;
  error(message: string, error?: Error, meta?: object): void;
  debug(message: string, meta?: object): void;
}

// Structured logging format
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  module: string;
  userId?: string;
  requestId?: string;
  meta?: object;
}
```

This design provides a comprehensive foundation for the WayrApp backend, addressing all requirements while maintaining scalability, security, and maintainability. The modular architecture supports the future transition to microservices, and the clear separation between Core Platform Data and Content Data enables the decentralized content vision.