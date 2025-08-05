/**
 * Content Test Fixtures
 * Standard content objects for different types and states
 */

import {
  Course,
  Level,
  Section,
  Module,
  Lesson,
  Exercise,
  LessonExercise,
  ModuleType,
  ExerciseType,
} from "@prisma/client";

/**
 * Course fixtures for different scenarios
 */
export const courseFixtures = {
  /**
   * Standard English to Spanish course
   */
  englishToSpanish: {
    id: "en-qu-course",
    sourceLanguage: "en",
    targetLanguage: "qu",
    name: "English to Quechua",
    description: "Learn Quechua from English",
    isPublic: true,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Course,

  /**
   * Spanish to English course
   */
  spanishToEnglish: {
    id: "aym-es-course",
    sourceLanguage: "aym",
    targetLanguage: "es-ES",
    name: "Aymara to Spanish",
    description: "Learn Spanish from Aymara",
    isPublic: true,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Course,

  /**
   * Private course (not publicly available)
   */
  privateCourse: {
    id: "private-course",
    sourceLanguage: "pt-BR",
    targetLanguage: "en",
    name: "Private Brazilian Portuguese Course",
    description: "Private course for testing",
    isPublic: false,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Course,

  /**
   * Course without description
   */
  courseWithoutDescription: {
    id: "no-desc-course",
    sourceLanguage: "qu",
    targetLanguage: "es-419",
    name: "Quechua to Latin American Spanish Course",
    description: null,
    isPublic: true,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Course,
};

/**
 * Level fixtures for different scenarios
 */
export const levelFixtures = {
  /**
   * Beginner level
   */
  beginner: {
    id: "en-es-course-beginner",
    courseId: "en-es-course",
    code: "A1",
    name: "Beginner",
    order: 1,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Level,

  /**
   * Intermediate level
   */
  intermediate: {
    id: "en-es-course-intermediate",
    courseId: "en-es-course",
    code: "B1",
    name: "Intermediate",
    order: 2,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Level,

  /**
   * Advanced level
   */
  advanced: {
    id: "en-es-course-advanced",
    courseId: "en-es-course",
    code: "C1",
    name: "Advanced",
    order: 3,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Level,
};

/**
 * Section fixtures for different scenarios
 */
export const sectionFixtures = {
  /**
   * Basic greetings section
   */
  greetings: {
    id: "beginner-greetings-section",
    levelId: "en-es-course-beginner",
    name: "Greetings and Introductions",
    order: 1,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Section,

  /**
   * Family vocabulary section
   */
  family: {
    id: "beginner-family-section",
    levelId: "en-es-course-beginner",
    name: "Family and Relationships",
    order: 2,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Section,

  /**
   * Food and dining section
   */
  food: {
    id: "intermediate-food-section",
    levelId: "en-es-course-intermediate",
    name: "Food and Dining",
    order: 1,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Section,
};

/**
 * Module fixtures for different types and scenarios
 */
export const moduleFixtures = {
  /**
   * Informative module
   */
  greetingsInfo: {
    id: "greetings-info-module",
    sectionId: "beginner-greetings-section",
    moduleType: ModuleType.informative,
    name: "Introduction to Greetings",
    order: 1,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Module,

  /**
   * Basic lesson module
   */
  greetingsLesson: {
    id: "greetings-lesson-module",
    sectionId: "beginner-greetings-section",
    moduleType: ModuleType.basic_lesson,
    name: "Basic Greetings",
    order: 2,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Module,

  /**
   * Reading module
   */
  familyReading: {
    id: "family-reading-module",
    sectionId: "beginner-family-section",
    moduleType: ModuleType.reading,
    name: "Family Story Reading",
    order: 1,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Module,

  /**
   * Dialogue module
   */
  familyDialogue: {
    id: "family-dialogue-module",
    sectionId: "beginner-family-section",
    moduleType: ModuleType.dialogue,
    name: "Family Conversation",
    order: 2,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Module,

  /**
   * Exam module
   */
  greetingsExam: {
    id: "greetings-exam-module",
    sectionId: "beginner-greetings-section",
    moduleType: ModuleType.exam,
    name: "Greetings Assessment",
    order: 3,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Module,
};

/**
 * Lesson fixtures for different scenarios
 */
export const lessonFixtures = {
  /**
   * Basic greeting lesson
   */
  basicGreetings: {
    id: "basic-greetings-lesson",
    moduleId: "greetings-lesson-module",
    experiencePoints: 10,
    order: 1,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Lesson,

  /**
   * Formal greetings lesson
   */
  formalGreetings: {
    id: "formal-greetings-lesson",
    moduleId: "greetings-lesson-module",
    experiencePoints: 15,
    order: 2,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Lesson,

  /**
   * Family members lesson
   */
  familyMembers: {
    id: "family-members-lesson",
    moduleId: "family-dialogue-module",
    experiencePoints: 20,
    order: 1,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Lesson,

  /**
   * High-value lesson (more experience points)
   */
  advancedLesson: {
    id: "advanced-lesson",
    moduleId: "greetings-exam-module",
    experiencePoints: 50,
    order: 1,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Lesson,
};

/**
 * Exercise fixtures for different types and scenarios
 */
export const exerciseFixtures = {
  /**
   * Translation exercise
   */
  translation: {
    id: "trans-ex-001",
    exerciseType: ExerciseType.translation,
    data: {
      sourceText: "Hello, how are you?",
      targetText: "Hola, ¿cómo estás?",
      hints: ["greeting", "question"],
    },
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Exercise,

  /**
   * Fill in the blank exercise
   */
  fillInTheBlank: {
    id: "fill-ex-001",
    exerciseType: ExerciseType.fill_in_the_blank,
    data: {
      sentence: "Mi nombre ___ Juan.",
      correctAnswer: "es",
      options: ["es", "está", "son", "están"],
      translation: "My name is Juan.",
    },
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Exercise,

  /**
   * True or False (VOF) exercise
   */
  trueOrFalse: {
    id: "vof-ex-001",
    exerciseType: ExerciseType.vof,
    data: {
      statement: "Madrid is the capital of Spain.",
      isTrue: true,
      explanation: "Madrid is indeed the capital city of Spain.",
    },
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Exercise,

  /**
   * Pairs matching exercise
   */
  pairs: {
    id: "pairs-ex-001",
    exerciseType: ExerciseType.pairs,
    data: {
      pairs: [
        { left: "Hola", right: "Hello" },
        { left: "Adiós", right: "Goodbye" },
        { left: "Gracias", right: "Thank you" },
        { left: "Por favor", right: "Please" },
      ],
    },
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Exercise,

  /**
   * Informative exercise
   */
  informative: {
    id: "info-ex-001",
    exerciseType: ExerciseType.informative,
    data: {
      title: "Spanish Greetings Culture",
      content: "In Spanish-speaking countries, greetings are very important...",
      imageUrl: "https://example.com/greetings-culture.jpg",
    },
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Exercise,

  /**
   * Ordering exercise
   */
  ordering: {
    id: "order-ex-001",
    exerciseType: ExerciseType.ordering,
    data: {
      instruction: "Put these words in the correct order to form a sentence.",
      words: ["Hola", "me", "llamo", "María"],
      correctOrder: [0, 2, 1, 3], // "Hola me llamo María"
      translation: "Hello, my name is María.",
    },
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  } as Exercise,
};

/**
 * Lesson-Exercise relationship fixtures
 */
export const lessonExerciseFixtures = {
  /**
   * Basic greetings lesson exercises
   */
  basicGreetingsExercises: [
    {
      lessonId: "basic-greetings-lesson",
      exerciseId: "info-ex-001",
      order: 1,
    } as LessonExercise,
    {
      lessonId: "basic-greetings-lesson",
      exerciseId: "trans-ex-001",
      order: 2,
    } as LessonExercise,
    {
      lessonId: "basic-greetings-lesson",
      exerciseId: "fill-ex-001",
      order: 3,
    } as LessonExercise,
  ],

  /**
   * Family members lesson exercises
   */
  familyMembersExercises: [
    {
      lessonId: "family-members-lesson",
      exerciseId: "pairs-ex-001",
      order: 1,
    } as LessonExercise,
    {
      lessonId: "family-members-lesson",
      exerciseId: "vof-ex-001",
      order: 2,
    } as LessonExercise,
    {
      lessonId: "family-members-lesson",
      exerciseId: "order-ex-001",
      order: 3,
    } as LessonExercise,
  ],
};

/**
 * Helper functions for creating content fixtures with variations
 */
export const contentFixtureHelpers = {
  /**
   * Create a course fixture with custom properties
   */
  createCourse: (overrides: Partial<Course> = {}): Course => ({
    ...courseFixtures.englishToSpanish,
    ...overrides,
  }),

  /**
   * Create a level fixture with custom properties
   */
  createLevel: (overrides: Partial<Level> = {}): Level => ({
    ...levelFixtures.beginner,
    ...overrides,
  }),

  /**
   * Create a section fixture with custom properties
   */
  createSection: (overrides: Partial<Section> = {}): Section => ({
    ...sectionFixtures.greetings,
    ...overrides,
  }),

  /**
   * Create a module fixture with custom properties
   */
  createModule: (overrides: Partial<Module> = {}): Module => ({
    ...moduleFixtures.greetingsLesson,
    ...overrides,
  }),

  /**
   * Create a lesson fixture with custom properties
   */
  createLesson: (overrides: Partial<Lesson> = {}): Lesson => ({
    ...lessonFixtures.basicGreetings,
    ...overrides,
  }),

  /**
   * Create an exercise fixture with custom properties
   */
  createExercise: (overrides: Partial<Exercise> = {}): Exercise => ({
    ...exerciseFixtures.translation,
    ...overrides,
  }),

  /**
   * Create a complete course structure with levels, sections, modules, and lessons
   */
  createCompleteCourseStructure: (
    courseId: string = "test-course",
  ): {
    course: Course;
    levels: Level[];
    sections: Section[];
    modules: Module[];
    lessons: Lesson[];
  } => {
    const course = contentFixtureHelpers.createCourse({ id: courseId });

    const levels = [
      contentFixtureHelpers.createLevel({
        id: `${courseId}-beginner`,
        courseId,
        code: "A1",
        name: "Beginner",
        order: 1,
      }),
      contentFixtureHelpers.createLevel({
        id: `${courseId}-intermediate`,
        courseId,
        code: "B1",
        name: "Intermediate",
        order: 2,
      }),
    ];

    const sections = [
      contentFixtureHelpers.createSection({
        id: `${courseId}-beginner-section1`,
        levelId: `${courseId}-beginner`,
        name: "Basic Vocabulary",
        order: 1,
      }),
      contentFixtureHelpers.createSection({
        id: `${courseId}-beginner-section2`,
        levelId: `${courseId}-beginner`,
        name: "Grammar Basics",
        order: 2,
      }),
    ];

    const modules = [
      contentFixtureHelpers.createModule({
        id: `${courseId}-module1`,
        sectionId: `${courseId}-beginner-section1`,
        moduleType: ModuleType.basic_lesson,
        name: "Vocabulary Lesson",
        order: 1,
      }),
      contentFixtureHelpers.createModule({
        id: `${courseId}-module2`,
        sectionId: `${courseId}-beginner-section1`,
        moduleType: ModuleType.exam,
        name: "Vocabulary Test",
        order: 2,
      }),
    ];

    const lessons = [
      contentFixtureHelpers.createLesson({
        id: `${courseId}-lesson1`,
        moduleId: `${courseId}-module1`,
        experiencePoints: 10,
        order: 1,
      }),
      contentFixtureHelpers.createLesson({
        id: `${courseId}-lesson2`,
        moduleId: `${courseId}-module1`,
        experiencePoints: 15,
        order: 2,
      }),
    ];

    return { course, levels, sections, modules, lessons };
  },

  /**
   * Create exercises for different types
   */
  createExercisesByType: (): Record<ExerciseType, Exercise> => ({
    [ExerciseType.translation]: contentFixtureHelpers.createExercise({
      id: "test-translation",
      exerciseType: ExerciseType.translation,
    }),
    [ExerciseType.translation_word_bank]: contentFixtureHelpers.createExercise({
      id: "test-translation-word-bank",
      exerciseType: ExerciseType.translation_word_bank,
      data: {
        source_text: "Hola mundo",
        target_text: "Hello world",
        word_bank: ["Hello", "world", "goodbye", "earth", "hi"],
        correct_words: ["Hello", "world"],
      },
    }),
    [ExerciseType.fill_in_the_blank]: contentFixtureHelpers.createExercise({
      id: "test-fill-blank",
      exerciseType: ExerciseType.fill_in_the_blank,
    }),
    [ExerciseType.vof]: contentFixtureHelpers.createExercise({
      id: "test-vof",
      exerciseType: ExerciseType.vof,
    }),
    [ExerciseType.pairs]: contentFixtureHelpers.createExercise({
      id: "test-pairs",
      exerciseType: ExerciseType.pairs,
    }),
    [ExerciseType.informative]: contentFixtureHelpers.createExercise({
      id: "test-info",
      exerciseType: ExerciseType.informative,
    }),
    [ExerciseType.ordering]: contentFixtureHelpers.createExercise({
      id: "test-ordering",
      exerciseType: ExerciseType.ordering,
    }),
  }),

  /**
   * Create a batch of courses for testing pagination
   */
  createCourseBatch: (count: number = 5): Course[] =>
    Array.from({ length: count }, (_, index) =>
      contentFixtureHelpers.createCourse({
        id: `batch-course-${index + 1}`,
        name: `Test Course ${index + 1}`,
        sourceLanguage: index % 2 === 0 ? "qu" : "aym",
        targetLanguage: index % 2 === 0 ? "es-ES" : "pt-BR",
      }),
    ),

  /**
   * Create modules with different types
   */
  createModulesWithAllTypes: (sectionId: string = "test-section"): Module[] =>
    Object.values(ModuleType).map((type, index) =>
      contentFixtureHelpers.createModule({
        id: `${sectionId}-${type}-module`,
        sectionId,
        moduleType: type,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Module`,
        order: index + 1,
      }),
    ),
};
