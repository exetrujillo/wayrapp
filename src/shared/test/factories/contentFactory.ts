/**
 * Content Factory for Test Data Generation
 * Creates test content data with customizable properties
 */
import { Course, Level, Section, Module, Lesson, Exercise } from '@prisma/client';
import { CreateSectionDto, CreateCourseDto, CreateLevelDto, CreateModuleDto } from '@/modules/content/types';

export class CourseFactory {
  static build(overrides: Partial<Course> = {}): Omit<Course, 'createdAt' | 'updatedAt'> {
    const courseId = `test-course-${Math.floor(Math.random() * 10000)}`;
    
    const defaultCourse = {
      id: courseId,
      sourceLanguage: 'qu',
      targetLanguage: 'es-ES',
      name: `Test Course ${courseId}`,
      description: 'A test course for unit testing',
      isPublic: true,
    };

    return {
      ...defaultCourse,
      ...overrides,
    };
  }

  static buildDto(overrides: Partial<CreateCourseDto> = {}): CreateCourseDto {
    const courseId = `test-course-${Math.floor(Math.random() * 10000)}`;
    
    const defaultCourse = {
      id: courseId,
      source_language: 'aym',
      target_language: 'es-ES',
      name: `Test Course ${courseId}`,
      description: 'A test course for unit testing',
      is_public: true,
    };

    return {
      ...defaultCourse,
      ...overrides,
    };
  }
}

export class LevelFactory {
  static build(courseId: string, overrides: Partial<Level> = {}): Omit<Level, 'createdAt' | 'updatedAt'> {
    const levelId = `${courseId}-level-${Math.floor(Math.random() * 10000)}`;
    
    const defaultLevel = {
      id: levelId,
      courseId: courseId,
      code: `L${Math.floor(Math.random() * 10)}`,
      name: `Test Level ${levelId}`,
      order: Math.floor(Math.random() * 10) + 1,
    };

    return {
      ...defaultLevel,
      ...overrides,
    };
  }

  static buildDto(courseId: string, overrides: Partial<CreateLevelDto> = {}): CreateLevelDto {
    const levelId = `${courseId}-level-${Math.floor(Math.random() * 10000)}`;
    
    const defaultLevel = {
      id: levelId,
      course_id: courseId,
      code: `L${Math.floor(Math.random() * 10)}`,
      name: `Test Level ${levelId}`,
      order: Math.floor(Math.random() * 10) + 1,
    };

    return {
      ...defaultLevel,
      ...overrides,
    };
  }
}

export class SectionFactory {
  static build(levelId: string, overrides: Partial<Section> = {}): Omit<Section, 'createdAt' | 'updatedAt'> {
    const sectionId = `${levelId}-section-${Math.floor(Math.random() * 10000)}`;
    
    const defaultSection = {
      id: sectionId,
      levelId: levelId,
      name: `Test Section ${sectionId}`,
      order: Math.floor(Math.random() * 10) + 1,
    };

    return {
      ...defaultSection,
      ...overrides,
    };
  }

  static buildDto(levelId: string, overrides: Partial<CreateSectionDto> = {}): CreateSectionDto {
    const sectionId = `${levelId}-section-${Math.floor(Math.random() * 10000)}`;
    
    const defaultSection = {
      id: sectionId,
      level_id: levelId,
      name: `Test Section ${sectionId}`,
      order: Math.floor(Math.random() * 10) + 1,
    };

    return {
      ...defaultSection,
      ...overrides,
    };
  }
}

export class ModuleFactory {
  static build(sectionId: string, overrides: Partial<Module> = {}): Omit<Module, 'createdAt' | 'updatedAt'> {
    const moduleId = `${sectionId}-module-${Math.floor(Math.random() * 10000)}`;
    
    const defaultModule = {
      id: moduleId,
      sectionId: sectionId,
      moduleType: 'basic_lesson' as const,
      name: `Test Module ${moduleId}`,
      order: Math.floor(Math.random() * 10) + 1,
    };

    return {
      ...defaultModule,
      ...overrides,
    };
  }

  static buildDto(sectionId: string, overrides: Partial<CreateModuleDto> = {}): CreateModuleDto {
    const moduleId = `${sectionId}-module-${Math.floor(Math.random() * 10000)}`;
    
    const defaultModule = {
      id: moduleId,
      section_id: sectionId,
      module_type: 'basic_lesson' as "informative" | "basic_lesson" | "reading" | "dialogue" | "exam",
      name: `Test Module ${moduleId}`,
      order: Math.floor(Math.random() * 10) + 1,
    };

    return {
      ...defaultModule,
      ...overrides,
    };
  }
}

export class LessonFactory {
  static build(moduleId: string, overrides: Partial<Lesson> = {}): Omit<Lesson, 'createdAt' | 'updatedAt'> {
    const lessonId = `${moduleId}-lesson-${Math.floor(Math.random() * 10000)}`;
    
    const defaultLesson = {
      id: lessonId,
      moduleId: moduleId,
      experiencePoints: 10,
      order: Math.floor(Math.random() * 10) + 1,
    };

    return {
      ...defaultLesson,
      ...overrides,
    };
  }
}

export class ExerciseFactory {
  static build(overrides: Partial<Exercise> = {}): Omit<Exercise, 'createdAt' | 'updatedAt'> {
    const exerciseId = `ex-${Math.floor(Math.random() * 100000)}`;
    
    const defaultExercise = {
      id: exerciseId,
      exerciseType: 'translation' as const,
      data: {
        source_text: 'Hello, how are you?',
        target_text: 'Hola, ¿cómo estás?',
        hints: ['greeting', 'question']
      },
    };

    return {
      ...defaultExercise,
      ...overrides,
    };
  }
  
  static buildFillInTheBlank(overrides: Partial<Exercise> = {}): Omit<Exercise, 'createdAt' | 'updatedAt'> {
    return this.build({
      exerciseType: 'fill_in_the_blank' as const,
      data: {
        text: 'The cat is ___ the table.',
        blanks: [
          {
            position: 0,
            correct_answers: ['on', 'under', 'near'],
            hints: ['position']
          }
        ]
      },
      ...overrides,
    });
  }
}