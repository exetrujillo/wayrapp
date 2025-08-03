import { 
  courseSchema, 
  levelSchema, 
  moduleSchema, 
  lessonSchema, 
  exerciseSchema 
} from '../../utils/validation';

describe('Validation Schemas', () => {
  describe('courseSchema', () => {
    const validCourseData = {
      id: 'test-course',
      name: 'Test Course',
      sourceLanguage: 'en',
      targetLanguage: 'es',
      description: 'Test description',
      isPublic: true,
    };

    it('should validate correct course data', () => {
      const result = courseSchema.safeParse(validCourseData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validCourseData);
      }
    });

    it('should require course ID', () => {
      const invalidData = { ...validCourseData, id: '' };
      const result = courseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Course ID is required');
      }
    });

    it('should validate course ID format', () => {
      const invalidData = { ...validCourseData, id: 'invalid ID with spaces' };
      const result = courseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Course ID can only contain letters, numbers, and hyphens');
      }
    });

    it('should validate course ID length', () => {
      const invalidData = { ...validCourseData, id: 'a'.repeat(21) };
      const result = courseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Course ID must be 20 characters or less');
      }
    });

    it('should require course name', () => {
      const invalidData = { ...validCourseData, name: '' };
      const result = courseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Course name is required');
      }
    });

    it('should validate course name length', () => {
      const invalidData = { ...validCourseData, name: 'a'.repeat(101) };
      const result = courseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Course name must be 100 characters or less');
      }
    });

    it('should require source language', () => {
      const invalidData = { ...validCourseData, sourceLanguage: '' };
      const result = courseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Source language is required');
      }
    });

    it('should validate BCP 47 language codes', () => {
      const invalidData = { ...validCourseData, sourceLanguage: 'invalid-lang-code' };
      const result = courseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Please enter a valid BCP 47 language code');
      }
    });

    it('should accept valid BCP 47 language codes', () => {
      const validCodes = ['en', 'es', 'fr', 'de', 'en-US', 'es-MX', 'zh-CN'];
      
      validCodes.forEach(code => {
        const data = { ...validCourseData, sourceLanguage: code, targetLanguage: 'en' };
        const result = courseSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should validate description length', () => {
      const invalidData = { ...validCourseData, description: 'a'.repeat(256) };
      const result = courseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Description must be 255 characters or less');
      }
    });

    it('should allow optional description', () => {
      const { description, ...dataWithoutDescription } = validCourseData;
      
      const result = courseSchema.safeParse(dataWithoutDescription);
      expect(result.success).toBe(true);
    });

    it('should default isPublic to true', () => {
      const { isPublic, ...dataWithoutIsPublic } = validCourseData;
      
      const result = courseSchema.safeParse(dataWithoutIsPublic);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPublic).toBe(true);
      }
    });
  });

  describe('levelSchema', () => {
    const validLevelData = {
      code: 'A1',
      name: 'Beginner',
      order: 1,
    };

    it('should validate correct level data', () => {
      const result = levelSchema.safeParse(validLevelData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validLevelData);
      }
    });

    it('should require level code', () => {
      const invalidData = { ...validLevelData, code: '' };
      const result = levelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Level code is required');
      }
    });

    it('should validate level code length', () => {
      const invalidData = { ...validLevelData, code: 'a'.repeat(11) };
      const result = levelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Level code must be 10 characters or less');
      }
    });

    it('should require level name', () => {
      const invalidData = { ...validLevelData, name: '' };
      const result = levelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Level name is required');
      }
    });

    it('should validate level name length', () => {
      const invalidData = { ...validLevelData, name: 'a'.repeat(101) };
      const result = levelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Level name must be 100 characters or less');
      }
    });

    it('should require positive order', () => {
      const invalidData = { ...validLevelData, order: 0 };
      const result = levelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Order must be a positive number');
      }
    });
  });

  describe('exerciseSchema', () => {
    it('should validate translation exercise', () => {
      const translationExercise = {
        exerciseType: 'translation' as const,
        data: {
          sourceText: 'Hello',
          targetText: 'Hola',
        },
      };

      const result = exerciseSchema.safeParse(translationExercise);
      expect(result.success).toBe(true);
    });

    it('should validate fill-in-the-blank exercise', () => {
      const fillInTheBlankExercise = {
        exerciseType: 'fill-in-the-blank' as const,
        data: {
          text: 'The cat is _____ the table.',
          blanks: [
            {
              position: 11,
              correctAnswers: ['on', 'under'],
            },
          ],
        },
      };

      const result = exerciseSchema.safeParse(fillInTheBlankExercise);
      expect(result.success).toBe(true);
    });

    it('should validate VOF exercise', () => {
      const vofExercise = {
        exerciseType: 'vof' as const,
        data: {
          statement: 'The sky is blue.',
          isTrue: true,
          explanation: 'The sky appears blue due to light scattering.',
        },
      };

      const result = exerciseSchema.safeParse(vofExercise);
      expect(result.success).toBe(true);
    });

    it('should validate pairs exercise', () => {
      const pairsExercise = {
        exerciseType: 'pairs' as const,
        data: {
          pairs: [
            { left: 'Hello', right: 'Hola' },
            { left: 'Goodbye', right: 'Adiós' },
          ],
        },
      };

      const result = exerciseSchema.safeParse(pairsExercise);
      expect(result.success).toBe(true);
    });

    it('should validate ordering exercise', () => {
      const orderingExercise = {
        exerciseType: 'ordering' as const,
        data: {
          items: [
            { id: '1', text: 'First' },
            { id: '2', text: 'Second' },
            { id: '3', text: 'Third' },
          ],
        },
      };

      const result = exerciseSchema.safeParse(orderingExercise);
      expect(result.success).toBe(true);
    });

    it('should validate informative exercise', () => {
      const informativeExercise = {
        exerciseType: 'informative' as const,
        data: {
          title: 'Spanish Grammar Rules',
          content: 'Here are some important grammar rules...',
          media: {
            type: 'image' as const,
            url: 'https://example.com/image.jpg',
            alt: 'Grammar diagram',
          },
        },
      };

      const result = exerciseSchema.safeParse(informativeExercise);
      expect(result.success).toBe(true);
    });

    it('should reject invalid exercise type', () => {
      const invalidExercise = {
        exerciseType: 'invalid-type',
        data: {},
      };

      const result = exerciseSchema.safeParse(invalidExercise);
      expect(result.success).toBe(false);
    });

    it('should require correct data structure for each exercise type', () => {
      const invalidTranslationExercise = {
        exerciseType: 'translation' as const,
        data: {
          sourceText: 'Hello',
          // Missing targetText
        },
      };

      const result = exerciseSchema.safeParse(invalidTranslationExercise);
      expect(result.success).toBe(false);
    });
  });

  describe('moduleSchema', () => {
    const validModuleData = {
      moduleType: 'basic_lesson' as const,
      name: 'Introduction to Spanish',
      order: 1,
    };

    it('should validate correct module data', () => {
      const result = moduleSchema.safeParse(validModuleData);
      expect(result.success).toBe(true);
    });

    it('should validate module types', () => {
      const validTypes = ['informative', 'basic_lesson', 'reading', 'dialogue', 'exam'];
      
      validTypes.forEach(type => {
        const data = { ...validModuleData, moduleType: type };
        const result = moduleSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid module type', () => {
      const invalidData = { ...validModuleData, moduleType: 'invalid-type' };
      const result = moduleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('lessonSchema', () => {
    const validLessonData = {
      name: 'Test Lesson',
      description: 'Test lesson description',
      experiencePoints: 10,
      order: 1,
    };

    it('should validate correct lesson data', () => {
      const result = lessonSchema.safeParse(validLessonData);
      expect(result.success).toBe(true);
    });

    it('should require non-negative experience points', () => {
      const invalidData = { ...validLessonData, experiencePoints: -1 };
      const result = lessonSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Experience points must be non-negative');
      }
    });

    it('should require positive order', () => {
      const invalidData = { ...validLessonData, order: 0 };
      const result = lessonSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Order must be a positive number');
      }
    });
  });
});