/**
 * WayrApp Backend API
 * Open-source language learning platform
 *
 * @author Exequiel Trujillo
 * @version 1.0.0
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";

import {
  errorHandler,
  requestLogger,
  corsOptions,
  defaultRateLimiter,
  helmetOptions,
  sanitizeInput,
  securityHeaders,
  requestSizeLimiter,
  xssProtection,
} from "@/shared/middleware";

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet(helmetOptions));
app.use(compression());
app.use(securityHeaders);

// CORS configuration
app.use(cors(corsOptions));

// Rate limiting
app.use(defaultRateLimiter);

// Request size limiting
app.use(requestSizeLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Input sanitization and XSS protection
app.use(sanitizeInput);
app.use(xssProtection);

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env["NODE_ENV"] || "development",
  });
});

// Import routes
import authRoutes from "@/modules/users/routes/authRoutes";
import userRoutes from "@/modules/users/routes/userRoutes";
import {
  createContentRoutes,
  createLessonRoutes,
  createExerciseRoutes,
} from "@/modules/content/routes";
import { createProgressRoutes } from "@/modules/progress/routes/progressRoutes";
import { prisma } from "@/shared/database/connection";

// API versioning configuration
const API_VERSION = "v1";
const API_BASE = `/api/${API_VERSION}`;

// API root endpoint
app.get("/api", (_req, res) => {
  res.json({
    message: "WayrApp API",
    version: "1.0.0",
    current_version: API_VERSION,
    documentation: "/api/docs",
    health: "/health",
    endpoints: {
      auth: `${API_BASE}/auth`,
      users: `${API_BASE}/users`,
      courses: `${API_BASE}/courses`,
      exercises: `${API_BASE}/exercises`,
      progress: `${API_BASE}/progress`,
    },
  });
});

// API documentation endpoint
app.get("/api/docs", (_req, res) => {
  res.json({
    openapi: "3.0.0",
    info: {
      title: "WayrApp API Documentation",
      version: "1.0.0",
      description: "Open-source language learning platform backend API",
      contact: {
        name: "WayrApp Team",
        url: "https://github.com/wayrapp/backend",
        email: "support@wayrapp.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: API_BASE,
        description: "Production API",
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from login endpoint",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            username: { type: "string", nullable: true },
            country_code: {
              type: "string",
              minLength: 2,
              maxLength: 2,
              nullable: true,
            },
            registration_date: { type: "string", format: "date-time" },
            last_login_date: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            profile_picture_url: {
              type: "string",
              format: "uri",
              nullable: true,
            },
            is_active: { type: "boolean" },
            role: {
              type: "string",
              enum: ["student", "content_creator", "admin"],
            },
          },
        },
        Course: {
          type: "object",
          properties: {
            id: { type: "string", maxLength: 20 },
            source_language: { type: "string", maxLength: 5 },
            target_language: { type: "string", maxLength: 5 },
            name: { type: "string", maxLength: 100 },
            description: { type: "string", nullable: true },
            is_public: { type: "boolean" },
            levels_count: { type: "integer", nullable: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Exercise: {
          type: "object",
          properties: {
            id: { type: "string", maxLength: 15 },
            exercise_type: {
              type: "string",
              enum: [
                "translation",
                "fill-in-the-blank",
                "vof",
                "pairs",
                "informative",
                "ordering",
              ],
            },
            data: {
              type: "object",
              description: "Exercise-specific data structure",
            },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        UserProgress: {
          type: "object",
          properties: {
            user_id: { type: "string", format: "uuid" },
            experience_points: { type: "integer", minimum: 0 },
            lives_current: { type: "integer", minimum: 0, maximum: 5 },
            streak_current: { type: "integer", minimum: 0 },
            last_completed_lesson_id: { type: "string", nullable: true },
            last_activity_date: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: { type: "object", nullable: true },
                timestamp: { type: "string", format: "date-time" },
                path: { type: "string" },
              },
            },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            data: { type: "array", items: {} },
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer" },
                limit: { type: "integer" },
                total: { type: "integer" },
                totalPages: { type: "integer" },
                hasNext: { type: "boolean" },
                hasPrev: { type: "boolean" },
              },
            },
          },
        },
      },
    },
    paths: {
      "/auth/register": {
        post: {
          summary: "Register new user",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: {
                      type: "string",
                      minLength: 8,
                      description:
                        "Must contain uppercase, lowercase, number, and special character",
                    },
                    username: { type: "string", minLength: 3, nullable: true },
                    country_code: { type: "string", length: 2, nullable: true },
                    profile_picture_url: {
                      type: "string",
                      format: "uri",
                      nullable: true,
                    },
                  },
                },
                example: {
                  email: "user@example.com",
                  password: "SecurePass123!",
                  username: "learner123",
                  country_code: "US",
                },
              },
            },
          },
          responses: {
            "201": {
              description: "User registered successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      user: { $ref: "#/components/schemas/User" },
                      tokens: {
                        type: "object",
                        properties: {
                          accessToken: { type: "string" },
                          refreshToken: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/ValidationError" },
            "409": { $ref: "#/components/responses/ConflictError" },
          },
        },
      },
      "/auth/login": {
        post: {
          summary: "User login",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
                example: {
                  email: "user@example.com",
                  password: "SecurePass123!",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      user: { $ref: "#/components/schemas/User" },
                      tokens: {
                        type: "object",
                        properties: {
                          accessToken: { type: "string" },
                          refreshToken: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/AuthenticationError" },
          },
        },
      },
      "/courses": {
        get: {
          summary: "List courses",
          tags: ["Content"],
          parameters: [
            { $ref: "#/components/parameters/PageParam" },
            { $ref: "#/components/parameters/LimitParam" },
            { $ref: "#/components/parameters/SortByParam" },
            { $ref: "#/components/parameters/SortOrderParam" },
          ],
          responses: {
            "200": {
              description: "Courses retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/PaginatedResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Course" },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create course",
          tags: ["Content"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "id",
                    "source_language",
                    "target_language",
                    "name",
                  ],
                  properties: {
                    id: { type: "string", maxLength: 20 },
                    source_language: { type: "string", maxLength: 5 },
                    target_language: { type: "string", maxLength: 5 },
                    name: { type: "string", maxLength: 100 },
                    description: { type: "string", nullable: true },
                    is_public: { type: "boolean", default: true },
                  },
                },
                example: {
                  id: "es-en-beginner",
                  source_language: "es",
                  target_language: "en",
                  name: "Spanish for Beginners",
                  description: "Learn basic Spanish vocabulary and grammar",
                  is_public: true,
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Course created successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Course" },
                },
              },
            },
            "401": { $ref: "#/components/responses/AuthenticationError" },
            "403": { $ref: "#/components/responses/AuthorizationError" },
          },
        },
      },
      "/progress": {
        get: {
          summary: "Get user progress",
          tags: ["Progress"],
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "User progress retrieved successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserProgress" },
                },
              },
            },
            "401": { $ref: "#/components/responses/AuthenticationError" },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "User authentication and authorization",
      },
      {
        name: "Users",
        description: "User profile management",
      },
      {
        name: "Content",
        description: "Educational content management",
      },
      {
        name: "Progress",
        description: "User progress tracking",
      },
    ],
    externalDocs: {
      description: "Find more info here",
      url: "https://github.com/wayrapp/backend",
    },
    "x-rate-limiting": {
      description: "API rate limiting information",
      limits: {
        default: "100 requests per 15 minutes",
        auth: "5 requests per 15 minutes for authentication endpoints",
        burst: "1000 requests per hour for authenticated users",
      },
    },
    "x-versioning": {
      current: API_VERSION,
      supported: [API_VERSION],
      deprecated: [],
      sunset_policy: "6 months notice for version deprecation",
    },
    "x-examples": {
      authentication_flow: {
        description: "Complete authentication flow example",
        steps: [
          {
            step: 1,
            description: "Register new user",
            request: `POST ${API_BASE}/auth/register`,
            body: {
              email: "user@example.com",
              password: "SecurePass123!",
              username: "learner123",
            },
          },
          {
            step: 2,
            description: "Login with credentials",
            request: `POST ${API_BASE}/auth/login`,
            body: {
              email: "user@example.com",
              password: "SecurePass123!",
            },
          },
          {
            step: 3,
            description: "Use access token for authenticated requests",
            request: `GET ${API_BASE}/users/profile`,
            headers: {
              Authorization: "Bearer <access_token>",
            },
          },
        ],
      },
      content_hierarchy: {
        description: "Content hierarchy navigation example",
        flow: [
          `GET ${API_BASE}/courses - List all courses`,
          `GET ${API_BASE}/courses/{courseId}/levels - Get levels in course`,
          `GET ${API_BASE}/levels/{levelId}/sections - Get sections in level`,
          `GET ${API_BASE}/sections/{sectionId}/modules - Get modules in section`,
          `GET ${API_BASE}/modules/{moduleId}/lessons - Get lessons in module`,
          `GET ${API_BASE}/lessons/{lessonId}/exercises - Get exercises in lesson`,
        ],
      },
      offline_sync: {
        description: "Offline synchronization example",
        steps: [
          {
            step: 1,
            description: "Download packaged course for offline use",
            request: `GET ${API_BASE}/courses/{courseId}/package`,
          },
          {
            step: 2,
            description: "Sync progress when back online",
            request: `PUT ${API_BASE}/progress/sync`,
            body: {
              completions: [
                {
                  lesson_id: "lesson-123",
                  completed_at: "2024-01-20T10:30:00Z",
                  score: 85,
                  time_spent_seconds: 300,
                },
              ],
              experience_gained: 50,
              last_activity: "2024-01-20T10:35:00Z",
            },
          },
        ],
      },
    },
  });
});

// Versioned API routes
// Authentication routes
app.use(`${API_BASE}/auth`, authRoutes);

// User routes
app.use(`${API_BASE}/users`, userRoutes);

// Content routes
app.use(API_BASE, createContentRoutes(prisma));
app.use(API_BASE, createLessonRoutes(prisma));
app.use(API_BASE, createExerciseRoutes(prisma));

// Progress routes
app.use(API_BASE, createProgressRoutes(prisma));

// Detailed documentation endpoints
app.get("/api/docs/overview", (_req, res) => {
  res.json({
    title: "WayrApp API Overview",
    description:
      "Comprehensive API documentation with examples and usage patterns",
    base_url: API_BASE,
    documentation_sections: {
      authentication: "/api/docs/authentication",
      users: "/api/docs/users",
      content: "/api/docs/content",
      lessons_exercises: "/api/docs/lessons-exercises",
      progress: "/api/docs/progress",
      packaged_content: "/api/docs/packaged-content",
      database_setup: "/api/docs/database-setup",
    },
    response_format: {
      success: {
        success: true,
        timestamp: "ISO timestamp",
        data: "Response data",
      },
      error: {
        success: false,
        timestamp: "ISO timestamp",
        error: {
          code: "ERROR_CODE",
          message: "Error description",
          details: "Additional error details (optional)",
          path: "Request path",
        },
      },
    },
    pagination: {
      query_params: {
        page: "Page number (default: 1)",
        limit: "Items per page (default: 20, max: 100)",
        sortBy: "Field to sort by",
        sortOrder: "asc or desc (default: asc)",
      },
      response_headers: {
        "X-Total-Count": "Total number of items",
        "X-Total-Pages": "Total number of pages",
        "X-Current-Page": "Current page number",
        "X-Has-Next": "Whether there are more pages",
        "X-Has-Prev": "Whether there are previous pages",
      },
    },
    content_hierarchy: {
      description: "WayrApp follows a hierarchical content structure",
      structure: "Course → Level → Section → Module → Lesson → Exercise",
      relationships: {
        courses: "contain multiple levels",
        levels: "contain multiple sections",
        sections: "contain multiple modules",
        modules: "contain multiple lessons",
        lessons: "can have multiple exercises (many-to-many)",
      },
    },
    security: {
      authentication: "JWT Bearer tokens",
      password_requirements: [
        "Minimum 8 characters",
        "At least one uppercase letter",
        "At least one lowercase letter",
        "At least one number",
        "At least one special character",
      ],
      rate_limiting: {
        auth_endpoints: "5 requests per minute per IP",
        content_creation: "10 requests per minute per user",
        general_read: "100 requests per minute per user",
        progress_tracking: "50 requests per minute per user",
      },
    },
  });
});

app.get("/api/docs/authentication", (_req, res) => {
  res.json({
    title: "Authentication Endpoints",
    description:
      "User registration, login, token management, and authentication flows",
    endpoints: {
      register: {
        method: "POST",
        path: `${API_BASE}/auth/register`,
        description: "Register a new user account",
        authentication: "None required",
        request_body: {
          email: "user@example.com (required)",
          password: "SecureP@ssw0rd (required, min 8 chars with complexity)",
          username: "johndoe (optional)",
          country_code: "US (optional, 2-letter code)",
          profile_picture_url: "https://example.com/avatar.jpg (optional)",
        },
        response: {
          user: "User object with id, email, username, role",
          tokens: "Access token (15min) and refresh token (7 days)",
        },
      },
      login: {
        method: "POST",
        path: `${API_BASE}/auth/login`,
        description: "Authenticate user and receive tokens",
        authentication: "None required",
        request_body: {
          email: "user@example.com (required)",
          password: "SecureP@ssw0rd (required)",
        },
        response: {
          user: "User object with profile information",
          tokens: "New access and refresh tokens",
        },
      },
      refresh: {
        method: "POST",
        path: `${API_BASE}/auth/refresh`,
        description: "Get new access token using refresh token",
        authentication: "None required",
        request_body: {
          refreshToken: "Valid refresh token (required)",
        },
        response: {
          tokens: "New access and refresh tokens",
        },
      },
      logout: {
        method: "POST",
        path: `${API_BASE}/auth/logout`,
        description: "Invalidate refresh token and logout",
        authentication: "Bearer token required",
        request_body: {
          refreshToken: "Refresh token to invalidate (required)",
        },
        response: {
          message: "Logout confirmation message",
        },
      },
      me: {
        method: "GET",
        path: `${API_BASE}/auth/me`,
        description: "Get current authenticated user information",
        authentication: "Bearer token required",
        response: {
          user: "Complete user profile with all fields",
        },
      },
    },
    security_features: {
      password_hashing: "bcrypt with salt",
      jwt_expiration: {
        access_token: "15 minutes",
        refresh_token: "7 days",
      },
      token_blacklisting: "Refresh tokens stored and can be revoked",
      rate_limiting: "5 requests per minute for auth endpoints",
    },
  });
});

app.get("/api/docs/users", (_req, res) => {
  res.json({
    title: "User Management Endpoints",
    description: "User profile management and administrative user operations",
    endpoints: {
      get_profile: {
        method: "GET",
        path: `${API_BASE}/users/profile`,
        description: "Get current user's profile information",
        authentication: "Bearer token required",
        response: "Complete user profile object",
      },
      update_profile: {
        method: "PUT",
        path: `${API_BASE}/users/profile`,
        description: "Update current user's profile",
        authentication: "Bearer token required",
        request_body: {
          username: "newusername (optional)",
          country_code: "CA (optional, 2-letter code)",
          profile_picture_url: "https://example.com/avatar.jpg (optional)",
        },
      },
      update_password: {
        method: "PUT",
        path: `${API_BASE}/users/password`,
        description: "Update user's password",
        authentication: "Bearer token required",
        request_body: {
          current_password: "Current password (required)",
          new_password:
            "New password meeting complexity requirements (required)",
        },
      },
      list_users: {
        method: "GET",
        path: `${API_BASE}/users`,
        description: "Get paginated list of all users (admin only)",
        authentication: "Admin role required",
        query_params: {
          page: "Page number",
          limit: "Items per page",
          role: "Filter by role (student/content_creator/admin)",
          is_active: "Filter by active status (true/false)",
          search: "Search term for email/username",
        },
      },
      get_user: {
        method: "GET",
        path: `${API_BASE}/users/:id`,
        description: "Get specific user by ID (admin only)",
        authentication: "Admin role required",
        path_params: {
          id: "User UUID",
        },
      },
      update_role: {
        method: "PUT",
        path: `${API_BASE}/users/:id/role`,
        description: "Update user's role (admin only)",
        authentication: "Admin role required",
        request_body: {
          role: "New role (student/content_creator/admin)",
        },
      },
    },
    user_roles: {
      student: "Regular learner with basic access",
      content_creator: "Can create and edit content",
      admin: "Full system access including user management",
    },
  });
});

app.get("/api/docs/content", (_req, res) => {
  res.json({
    title: "Content Management Endpoints",
    description:
      "Hierarchical content management for courses, levels, sections, and modules",
    content_hierarchy: "Course → Level → Section → Module → Lesson → Exercise",
    endpoints: {
      courses: {
        list: `GET ${API_BASE}/courses`,
        create: `POST ${API_BASE}/courses (admin/content_creator)`,
        get: `GET ${API_BASE}/courses/:id`,
        update: `PUT ${API_BASE}/courses/:id (admin/content_creator)`,
        delete: `DELETE ${API_BASE}/courses/:id (admin)`,
        package: `GET ${API_BASE}/courses/:id/package (offline support)`,
      },
      levels: {
        list: `GET ${API_BASE}/courses/:courseId/levels`,
        create: `POST ${API_BASE}/courses/:courseId/levels (admin/content_creator)`,
        get: `GET ${API_BASE}/courses/:courseId/levels/:id`,
        update: `PUT ${API_BASE}/courses/:courseId/levels/:id (admin/content_creator)`,
        delete: `DELETE ${API_BASE}/courses/:courseId/levels/:id (admin)`,
      },
      sections: {
        list: `GET ${API_BASE}/levels/:levelId/sections`,
        create: `POST ${API_BASE}/levels/:levelId/sections (admin/content_creator)`,
        get: `GET ${API_BASE}/levels/:levelId/sections/:id`,
        update: `PUT ${API_BASE}/levels/:levelId/sections/:id (admin/content_creator)`,
        delete: `DELETE ${API_BASE}/levels/:levelId/sections/:id (admin)`,
      },
      modules: {
        list: `GET ${API_BASE}/sections/:sectionId/modules`,
        create: `POST ${API_BASE}/sections/:sectionId/modules (admin/content_creator)`,
        get: `GET ${API_BASE}/sections/:sectionId/modules/:id`,
        update: `PUT ${API_BASE}/sections/:sectionId/modules/:id (admin/content_creator)`,
        delete: `DELETE ${API_BASE}/sections/:sectionId/modules/:id (admin)`,
      },
    },
    data_structures: {
      course: {
        id: "Unique course identifier (max 20 chars)",
        source_language: "2-5 letter language code",
        target_language: "2-5 letter language code",
        name: "Course name (max 100 chars)",
        description: "Optional course description",
        is_public: "Boolean visibility flag",
      },
      level: {
        id: "Unique level identifier",
        course_id: "Parent course ID",
        code: "Level code (A1, A2, B1, etc.)",
        name: "Level name",
        order: "Display order within course",
      },
      section: {
        id: "Unique section identifier",
        level_id: "Parent level ID",
        name: "Section name",
        order: "Display order within level",
      },
      module: {
        id: "Unique module identifier",
        section_id: "Parent section ID",
        module_type: "informative/basic_lesson/reading/dialogue/exam",
        name: "Module name",
        order: "Display order within section",
      },
    },
    offline_support: {
      packaged_courses: {
        endpoint: `GET ${API_BASE}/courses/:id/package`,
        description: "Complete course with all nested content",
        features: [
          "Single request for entire course hierarchy",
          "Versioning with last-modified timestamps",
          "HTTP caching with conditional requests",
          "Optimized for offline usage",
        ],
      },
    },
  });
});

app.get("/api/docs/lessons-exercises", (_req, res) => {
  res.json({
    title: "Lessons & Exercises Management",
    description:
      "Lesson management and exercise assignment with reusable exercise system",
    endpoints: {
      lessons: {
        list: `GET ${API_BASE}/modules/:moduleId/lessons`,
        create: `POST ${API_BASE}/modules/:moduleId/lessons (admin/content_creator)`,
        get: `GET ${API_BASE}/modules/:moduleId/lessons/:id`,
        update: `PUT ${API_BASE}/modules/:moduleId/lessons/:id (admin/content_creator)`,
        delete: `DELETE ${API_BASE}/modules/:moduleId/lessons/:id (admin)`,
      },
      lesson_exercises: {
        list: `GET ${API_BASE}/lessons/:lessonId/exercises`,
        assign: `POST ${API_BASE}/lessons/:lessonId/exercises (admin/content_creator)`,
        unassign: `DELETE ${API_BASE}/lessons/:lessonId/exercises/:exerciseId (admin/content_creator)`,
        reorder: `PUT ${API_BASE}/lessons/:lessonId/exercises/reorder (admin/content_creator)`,
      },
      exercises: {
        list: `GET ${API_BASE}/exercises`,
        create: `POST ${API_BASE}/exercises (admin/content_creator)`,
        get: `GET ${API_BASE}/exercises/:id`,
        update: `PUT ${API_BASE}/exercises/:id (admin/content_creator)`,
        delete: `DELETE ${API_BASE}/exercises/:id (admin)`,
        by_type: `GET ${API_BASE}/exercises/type/:type`,
      },
    },
    exercise_types: {
      translation: {
        description: "Translate text from source to target language",
        data_structure: {
          source_text: "Text to translate",
          target_text: "Correct translation",
          hints: "Array of optional hints",
        },
      },
      "fill-in-the-blank": {
        description: "Complete sentences with missing words",
        data_structure: {
          text: "Text with _____ blanks",
          blanks: "Array of blank definitions with correct answers",
        },
      },
      vof: {
        description: "True or False questions (Verdadero o Falso)",
        data_structure: {
          statement: "Statement to evaluate",
          is_true: "Boolean correct answer",
          explanation: "Optional explanation",
        },
      },
      pairs: {
        description: "Match items from two columns",
        data_structure: {
          pairs: "Array of left/right item pairs",
        },
      },
      informative: {
        description: "Display information content",
        data_structure: {
          title: "Optional title",
          content: "Information content to display",
        },
      },
      ordering: {
        description: "Arrange items in correct order",
        data_structure: {
          items: "Array of items with correct order positions",
        },
      },
    },
    lesson_structure: {
      id: "Unique lesson identifier",
      module_id: "Parent module ID",
      experience_points: "Points awarded for completion",
      order: "Display order within module",
      exercises: "Array of assigned exercises with order",
    },
    exercise_reusability: {
      description: "Exercises are reusable across multiple lessons",
      many_to_many:
        "Lessons can have multiple exercises, exercises can be in multiple lessons",
      ordering: "Each lesson-exercise assignment has its own order",
    },
  });
});

app.get("/api/docs/progress", (_req, res) => {
  res.json({
    title: "Progress Tracking Endpoints",
    description:
      "User learning progress, experience points, lesson completions, and gamification",
    endpoints: {
      user_progress: {
        get: `GET ${API_BASE}/progress`,
        update: `PUT ${API_BASE}/progress`,
        summary: `GET ${API_BASE}/progress/summary`,
      },
      lesson_completion: {
        complete: `POST ${API_BASE}/progress/lesson/:id`,
        check: `GET ${API_BASE}/progress/lesson/:id/completed`,
        list: `GET ${API_BASE}/progress/completions`,
      },
      synchronization: {
        sync: `PUT ${API_BASE}/progress/sync`,
      },
      gamification: {
        update_lives: `PUT ${API_BASE}/progress/lives`,
      },
      admin_functions: {
        bonus_experience: `POST ${API_BASE}/progress/bonus (admin)`,
        reset_progress: `POST ${API_BASE}/progress/reset (admin)`,
        lesson_stats: `GET ${API_BASE}/progress/lesson/:id/stats (admin/content_creator)`,
      },
    },
    progress_system: {
      experience_points: {
        base_points: "Each lesson has base experience value",
        performance_multipliers: {
          "90%+": "+20% bonus experience",
          "80-89%": "+10% bonus experience",
          "60-79%": "No modifier",
          "<60%": "-20% experience reduction",
        },
        minimum_award: "At least 1 point always awarded",
      },
      streak_tracking: {
        daily_activity: "Increments on consecutive days",
        same_day: "Multiple completions maintain streak",
        streak_break: "Missing day resets to 1 on next completion",
      },
      lives_system: {
        default: "5 lives",
        range: "0-10 lives",
        usage: "Decremented for errors, incremented as rewards",
      },
    },
    offline_synchronization: {
      conflict_resolution: "Duplicate completions detected and skipped",
      timestamp_based: "More recent completions take precedence",
      batch_processing: "Multiple completions in single request",
      experience_accumulation: "All synced completions contribute to total",
    },
    data_validation: {
      score_range: "0-100",
      time_tracking: "Non-negative seconds",
      lesson_validation: "All lesson IDs validated against content database",
    },
  });
});

app.get("/api/docs/packaged-content", (_req, res) => {
  res.json({
    title: "Packaged Content API for Offline Support",
    description:
      "Offline-first functionality with efficient caching and versioning",
    features: {
      single_request: "Complete course with all nested content in one request",
      versioning: "Last-modified timestamps for update checking",
      caching: "15-minute in-memory cache with automatic invalidation",
      http_caching: "Proper cache headers for client-side caching",
    },
    endpoint: {
      method: "GET",
      path: `${API_BASE}/courses/:id/package`,
      description: "Get complete packaged course for offline use",
      authentication: "None required (public endpoint)",
    },
    conditional_requests: {
      header: "If-Modified-Since: Wed, 21 Oct 2024 07:28:00 GMT",
      response_304: "Returns 304 Not Modified if content unchanged",
      response_200: "Returns full package if content updated",
    },
    response_structure: {
      course: "Complete course information",
      levels: "Array of levels with nested sections, modules, lessons",
      package_version: "Timestamp of most recent content update",
    },
    caching_strategy: {
      ttl: "15 minutes for packaged courses",
      invalidation: "Automatic when any content in hierarchy changes",
      memory_management: "Periodic cleanup of expired entries",
    },
    performance: {
      database: "Single query with nested includes",
      network: "Reduces multiple API calls to single request",
      client_caching: "HTTP headers enable browser caching",
    },
  });
});

app.get("/api/docs/database-setup", (_req, res) => {
  res.json({
    title: "Database Setup Instructions",
    description: "Step-by-step guide for setting up the WayrApp database",
    prerequisites: [
      "Neon PostgreSQL database account",
      "Environment variables configured",
    ],
    setup_steps: [
      {
        step: 1,
        title: "Configure Environment Variables",
        command: "cp .env.example .env",
        description: "Create .env file with database connection string",
      },
      {
        step: 2,
        title: "Install Dependencies",
        command: "npm install",
        description: "Install all required packages",
      },
      {
        step: 3,
        title: "Generate Prisma Client",
        command: "npm run db:generate",
        description: "Generate type-safe database client",
      },
      {
        step: 4,
        title: "Run Database Migrations",
        command: "npm run db:migrate",
        description: "Create and apply database schema",
      },
      {
        step: 5,
        title: "Test Connection",
        command: "npm run db:test",
        description: "Verify database connectivity",
      },
    ],
    available_commands: {
      "npm run db:generate": "Generate Prisma client",
      "npm run db:push": "Push schema changes without migration",
      "npm run db:migrate": "Create and apply migration",
      "npm run db:migrate:prod": "Apply migrations in production",
      "npm run db:studio": "Open Prisma Studio GUI",
      "npm run db:test": "Test database connection",
    },
    database_schema: {
      users_auth: "User accounts with roles and social features",
      content_hierarchy: "Courses → Levels → Sections → Modules → Lessons",
      exercise_system:
        "Reusable exercises with many-to-many lesson relationships",
      progress_tracking:
        "User progress with experience points, streaks, completions",
    },
    troubleshooting: {
      connection_issues: [
        "Verify DATABASE_URL is correct",
        "Ensure Neon database is running",
        "Check SSL mode configuration",
      ],
      migration_issues: [
        "Check database permissions",
        "Verify database exists and is accessible",
        "Ensure no conflicting schema exists",
      ],
    },
  });
});

// API status endpoint
app.get("/api/status", (_req, res) => {
  res.json({
    status: "operational",
    version: "1.0.0",
    api_version: API_VERSION,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env["NODE_ENV"] || "development",
    database: "connected", // This could be enhanced with actual DB health check
  });
});

// Redirect /api/v1 to /api for backward compatibility
app.get("/api/v1", (_req, res) => {
  res.redirect(301, "/api");
});

// Handle requests to unsupported API versions
app.use("/api/v:version", (req, res) => {
  const requestedVersion = req.params.version;
  res.status(400).json({
    error: {
      code: "UNSUPPORTED_API_VERSION",
      message: `API version v${requestedVersion} is not supported`,
      supported_versions: [API_VERSION],
      current_version: API_VERSION,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    },
  });
});

// 404 handler for all other routes
app.use("*", (req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found",
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
      available_endpoints: {
        api_info: "/api",
        documentation: "/api/docs",
        health: "/health",
        status: "/api/status",
      },
    },
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
