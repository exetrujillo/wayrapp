import { API_ENDPOINTS, MODULE_TYPES, EXERCISE_TYPES } from '../../utils/constants';
import { LANGUAGES } from '../../utils/languages';

describe('Constants', () => {
  describe('LANGUAGES', () => {
    it('should contain common language codes', () => {
      const languageCodes = LANGUAGES.map(lang => lang.code);
      
      expect(languageCodes).toContain('en');
      expect(languageCodes).toContain('es');
      expect(languageCodes).toContain('fr');
      expect(languageCodes).toContain('eu');
    });

    it('should have proper structure for each language', () => {
      LANGUAGES.forEach(language => {
        expect(language).toHaveProperty('code');
        expect(language).toHaveProperty('name');
        expect(typeof language.code).toBe('string');
        expect(typeof language.name).toBe('string');
        expect(language.code.length).toBeGreaterThan(0);
        expect(language.name.length).toBeGreaterThan(0);
      });
    });

    it('should not have duplicate language codes', () => {
      const codes = LANGUAGES.map(lang => lang.code);
      const uniqueCodes = [...new Set(codes)];
      
      expect(codes.length).toBe(uniqueCodes.length);
    });
  });

  describe('API_ENDPOINTS', () => {
    it('should have correct course endpoints', () => {
      expect(API_ENDPOINTS.COURSES.BASE).toBe('/courses');
      expect(API_ENDPOINTS.COURSES.DETAIL('123')).toBe('/courses/123');
      expect(API_ENDPOINTS.COURSES.PACKAGE('123')).toBe('/courses/123/package');
    });

    it('should have correct hierarchical endpoints', () => {
      expect(API_ENDPOINTS.COURSES.LEVELS('course-1')).toBe('/courses/course-1/levels');
      expect(API_ENDPOINTS.LEVELS.DETAIL('level-1')).toBe('/levels/level-1');
      
      expect(API_ENDPOINTS.LEVELS.SECTIONS('level-1')).toBe('/levels/level-1/sections');
      expect(API_ENDPOINTS.SECTIONS.DETAIL('section-1')).toBe('/sections/section-1');
      
      expect(API_ENDPOINTS.SECTIONS.MODULES('section-1')).toBe('/sections/section-1/modules');
      expect(API_ENDPOINTS.MODULES.DETAIL('module-1')).toBe('/modules/module-1');
      
      expect(API_ENDPOINTS.MODULES.LESSONS('module-1')).toBe('/modules/module-1/lessons');
      expect(API_ENDPOINTS.LESSONS.DETAIL('lesson-1')).toBe('/lessons/lesson-1');
    });

    it('should have correct exercise endpoints', () => {
      expect(API_ENDPOINTS.EXERCISES.BASE).toBe('/exercises');
      expect(API_ENDPOINTS.EXERCISES.DETAIL('exercise-1')).toBe('/exercises/exercise-1');
      
      expect(API_ENDPOINTS.LESSONS.EXERCISES('lesson-1')).toBe('/lessons/lesson-1/exercises');
      expect(API_ENDPOINTS.LESSONS.REORDER_EXERCISES('lesson-1')).toBe('/lessons/lesson-1/exercises/reorder');
    });
  });

  describe('MODULE_TYPES', () => {
    it('should contain all expected module types', () => {
      const expectedTypes = ['informative', 'basic_lesson', 'reading', 'dialogue', 'exam'];
      const moduleTypeValues = MODULE_TYPES.map(type => type.value);
      
      expectedTypes.forEach(type => {
        expect(moduleTypeValues).toContain(type);
      });
    });

    it('should have proper structure for each module type', () => {
      MODULE_TYPES.forEach(moduleType => {
        expect(moduleType).toHaveProperty('value');
        expect(moduleType).toHaveProperty('label');
        expect(typeof moduleType.value).toBe('string');
        expect(typeof moduleType.label).toBe('string');
      });
    });
  });

  describe('EXERCISE_TYPES', () => {
    it('should contain all expected exercise types', () => {
      const expectedTypes = ['translation', 'translation-word-bank', 'fill-in-the-blank', 'vof', 'pairs', 'ordering', 'informative'];
      const exerciseTypeValues = EXERCISE_TYPES.map(type => type.value);
      
      expectedTypes.forEach(type => {
        expect(exerciseTypeValues).toContain(type);
      });
    });

    it('should have proper structure for each exercise type', () => {
      EXERCISE_TYPES.forEach(exerciseType => {
        expect(exerciseType).toHaveProperty('value');
        expect(exerciseType).toHaveProperty('label');
        expect(typeof exerciseType.value).toBe('string');
        expect(typeof exerciseType.label).toBe('string');
      });
    });
  });
});