/**
 * Mock Service Worker (MSW) handlers for API mocking
 * Provides realistic API responses for both testing and development
 */

import { http, HttpResponse } from 'msw';

// Use environment variable or default to localhost for development
const baseURL = process.env['VITE_API_URL'] || 'http://localhost:3000';

// Mock API responses (moved from test utils for reuse)
export const mockApiResponses = {
  login: {
    success: {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
    },
    error: {
      message: 'Invalid credentials',
      status: 401,
    },
  },
  courses: {
    success: {
      data: [
        {
          id: '1',
          name: 'Spanish Basics',
          description: 'Learn the fundamentals of Spanish language',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          isPublic: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'French Conversation',
          description: 'Practice conversational French',
          sourceLanguage: 'en',
          targetLanguage: 'fr',
          isPublic: false,
          createdAt: '2023-01-02T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z',
        },
        {
          id: '3',
          name: 'German Grammar',
          description: 'Master German grammar rules',
          sourceLanguage: 'en',
          targetLanguage: 'de',
          isPublic: true,
          createdAt: '2023-01-03T00:00:00Z',
          updatedAt: '2023-01-03T00:00:00Z',
        },
      ],
    },
  },
  lessons: {
    success: {
      data: [
        {
          id: '1',
          title: 'Basic Greetings',
          content: 'Learn how to say hello and goodbye',
          experience_points: 10,
          order: 1,
          moduleId: 'module-1',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        {
          id: '2',
          title: 'Numbers 1-10',
          content: 'Learn to count from 1 to 10',
          experience_points: 15,
          order: 2,
          moduleId: 'module-1',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ],
    },
  },
  exercises: {
    success: {
      data: [
        {
          id: '1',
          title: 'Translate Hello',
          type: 'translation',
          content: {
            source_text: 'Hello',
            target_text: 'Hola',
            options: ['Hola', 'Adiós', 'Gracias', 'Por favor'],
          },
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        {
          id: '2',
          title: 'Fill in the blank',
          type: 'fill-blank',
          content: {
            sentence: 'Buenos _____, ¿cómo está?',
            answer: 'días',
            hint: 'Morning greeting',
          },
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ],
    },
  },
  dashboard: {
    success: {
      statistics: {
        totalCourses: 3,
        totalLessons: 12,
        totalExercises: 45,
        totalStudents: 156,
        recentActivity: [
          {
            id: '1',
            type: 'course_created',
            description: 'Created new course "Spanish Basics"',
            timestamp: '2023-12-01T10:30:00Z',
          },
          {
            id: '2',
            type: 'lesson_updated',
            description: 'Updated lesson "Basic Greetings"',
            timestamp: '2023-12-01T09:15:00Z',
          },
        ],
      },
    },
  },
};

export const handlers = [
  // Authentication endpoints
  http.post(`${baseURL}/api/v1/auth/login`, async ({ request }) => {
    const body = await request.json() as any;
    const { email, password } = body;
    
    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json(mockApiResponses.login.success);
    }
    
    return HttpResponse.json(
      mockApiResponses.login.error,
      { status: 401 }
    );
  }),

  http.post(`${baseURL}/api/v1/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.post(`${baseURL}/api/v1/auth/refresh`, () => {
    return HttpResponse.json({
      token: 'new-mock-jwt-token',
      refreshToken: 'new-mock-refresh-token',
    });
  }),

  // Dashboard endpoints
  http.get(`${baseURL}/api/v1/dashboard/statistics`, () => {
    return HttpResponse.json(mockApiResponses.dashboard.success);
  }),

  // Course endpoints
  http.get(`${baseURL}/api/v1/courses`, ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '10';
    const search = url.searchParams.get('search');

    let courses = mockApiResponses.courses.success.data;
    
    if (search) {
      courses = courses.filter(course => 
        course.name.toLowerCase().includes(search.toLowerCase()) ||
        course.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedCourses = courses.slice(startIndex, endIndex);

    return HttpResponse.json({
      data: paginatedCourses,
      meta: {
        total: courses.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(courses.length / parseInt(limit)),
      },
    });
  }),

  http.get(`${baseURL}/api/v1/courses/:id`, ({ params }) => {
    const { id } = params;
    const course = mockApiResponses.courses.success.data.find(c => c.id === id);
    
    if (!course) {
      return HttpResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(course);
  }),

  http.post(`${baseURL}/api/v1/courses`, async ({ request }) => {
    const courseData = await request.json() as any;
    
    // Simulate validation error
    if (courseData.name === 'Invalid Course') {
      return HttpResponse.json(
        { message: 'Course name already exists' },
        { status: 400 }
      );
    }
    
    const newCourse = {
      id: Date.now().toString(),
      ...courseData,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json(newCourse, { status: 201 });
  }),

  http.put(`${baseURL}/api/v1/courses/:id`, async ({ params, request }) => {
    const { id } = params;
    const updateData = await request.json() as any;
    
    const course = mockApiResponses.courses.success.data.find(c => c.id === id);
    if (!course) {
      return HttpResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }
    
    const updatedCourse = {
      ...course,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json(updatedCourse);
  }),

  http.delete(`${baseURL}/api/v1/courses/:id`, ({ params }) => {
    const { id } = params;
    const course = mockApiResponses.courses.success.data.find(c => c.id === id);
    
    if (!course) {
      return HttpResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }
    
    return new HttpResponse(null, { status: 204 });
  }),

  // Lesson endpoints
  http.get(`${baseURL}/api/v1/lessons`, ({ request }) => {
    const url = new URL(request.url);
    const moduleId = url.searchParams.get('moduleId');
    
    let lessons = mockApiResponses.lessons.success.data;
    
    if (moduleId) {
      lessons = lessons.filter(lesson => lesson.moduleId === moduleId);
    }
    
    return HttpResponse.json({
      data: lessons,
      meta: {
        total: lessons.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    });
  }),

  http.get(`${baseURL}/api/v1/modules/:moduleId/lessons`, ({ params }) => {
    const { moduleId } = params;
    const lessons = mockApiResponses.lessons.success.data.filter(
      lesson => lesson.moduleId === moduleId
    );
    
    return HttpResponse.json({
      data: lessons,
      meta: {
        total: lessons.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    });
  }),

  http.post(`${baseURL}/api/v1/modules/:moduleId/lessons`, async ({ params, request }) => {
    const { moduleId } = params;
    const lessonData = await request.json() as any;
    
    const newLesson = {
      id: Date.now().toString(),
      ...lessonData,
      moduleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json(newLesson, { status: 201 });
  }),

  // Exercise endpoints
  http.get(`${baseURL}/api/v1/exercises`, ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '10';
    
    const exercises = mockApiResponses.exercises.success.data;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedExercises = exercises.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      data: paginatedExercises,
      meta: {
        total: exercises.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(exercises.length / parseInt(limit)),
      },
    });
  }),

  http.post(`${baseURL}/api/v1/exercises`, async ({ request }) => {
    const exerciseData = await request.json() as any;
    
    const newExercise = {
      id: Date.now().toString(),
      ...exerciseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json(newExercise, { status: 201 });
  }),

  http.post(`${baseURL}/api/v1/lessons/:lessonId/exercises`, async ({ params, request }) => {
    const { lessonId } = params;
    const assignmentData = await request.json() as any;
    
    const newAssignment = {
      id: Date.now().toString(),
      lessonId,
      ...assignmentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json(newAssignment, { status: 201 });
  }),

  // Module endpoints (for lesson form dropdowns)
  http.get(`${baseURL}/api/v1/modules`, () => {
    const modules = [
      {
        id: 'module-1',
        name: 'Basic Vocabulary',
        description: 'Learn basic words and phrases',
        order: 1,
        sectionId: 'section-1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'module-2',
        name: 'Grammar Basics',
        description: 'Learn fundamental grammar rules',
        order: 2,
        sectionId: 'section-1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'module-3',
        name: 'Conversation Practice',
        description: 'Practice real-world conversations',
        order: 3,
        sectionId: 'section-1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    ];
    
    return HttpResponse.json({ 
      data: modules,
      meta: {
        total: modules.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    });
  }),

  http.get(`${baseURL}/api/v1/sections/:sectionId/modules`, () => {
    const modules = [
      {
        id: 'module-1',
        name: 'Basic Vocabulary',
        description: 'Learn basic words and phrases',
        order: 1,
        sectionId: 'section-1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'module-2',
        name: 'Grammar Basics',
        description: 'Learn fundamental grammar rules',
        order: 2,
        sectionId: 'section-1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'module-3',
        name: 'Conversation Practice',
        description: 'Practice real-world conversations',
        order: 3,
        sectionId: 'section-1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    ];
    
    return HttpResponse.json({ data: modules });
  }),

  // Error simulation endpoints for testing
  http.get(`${baseURL}/api/v1/error/500`, () => {
    return HttpResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }),

  http.get(`${baseURL}/api/v1/error/network`, () => {
    // Simulate network error
    return HttpResponse.error();
  }),

  http.get(`${baseURL}/api/v1/error/timeout`, () => {
    // Simulate timeout by delaying response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(HttpResponse.json({ message: 'Request timeout' }, { status: 408 }));
      }, 5000);
    });
  }),

  // Catch-all handler for unhandled requests
  http.all('*', ({ request }) => {
    const url = new URL(request.url);
    
    // Only warn about API requests, not static assets
    if (url.pathname.startsWith('/api/')) {
      console.warn(`🔶 MSW: Unhandled ${request.method} request to ${request.url}`);
      return HttpResponse.json(
        { message: 'API endpoint not found' },
        { status: 404 }
      );
    }
    
    // Let non-API requests pass through
    return;
  }),
];