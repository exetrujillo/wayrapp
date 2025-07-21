import { 
  RegisterSchema, 
  LoginSchema, 
  PasswordSchema,
  CourseSchema,
  LessonSchema,
  ExerciseSchema,
  ProgressSyncSchema
} from '../index';

describe('Validation Schemas', () => {
  describe('PasswordSchema', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'StrongP@ss123',
        'C0mpl3x!Password',
        'Secure_P@ssw0rd'
      ];

      validPasswords.forEach(password => {
        const result = PasswordSchema.safeParse(password);
        expect(result.success).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const invalidPasswords = [
        'password', // No uppercase, number, or special char
        'Password', // No number or special char
        'password123', // No uppercase or special char
        'Password!', // No number
        'PASS123!', // No lowercase
        'Pa1!', // Too short
        'a'.repeat(101) + 'A1!' // Too long
      ];

      invalidPasswords.forEach(password => {
        const result = PasswordSchema.safeParse(password);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('RegisterSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'StrongP@ss123',
        username: 'testuser',
        country_code: 'US'
      };

      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid registration data', () => {
      const invalidData = [
        { // Invalid email
          email: 'invalid-email',
          password: 'StrongP@ss123',
          username: 'testuser'
        },
        { // Invalid password
          email: 'user@example.com',
          password: 'weak',
          username: 'testuser'
        },
        { // Invalid username
          email: 'user@example.com',
          password: 'StrongP@ss123',
          username: 'a' // Too short
        },
        { // Invalid country code
          email: 'user@example.com',
          password: 'StrongP@ss123',
          country_code: 'USA' // Too long
        }
      ];

      invalidData.forEach(data => {
        const result = RegisterSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('LoginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'anyPassword'
      };

      const result = LoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid login data', () => {
      const invalidData = [
        { // Missing password
          email: 'user@example.com'
        },
        { // Invalid email
          email: 'invalid-email',
          password: 'password'
        },
        { // Empty password
          email: 'user@example.com',
          password: ''
        }
      ];

      invalidData.forEach(data => {
        const result = LoginSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('CourseSchema', () => {
    it('should validate valid course data', () => {
      const validData = {
        id: 'es-en-beginner',
        source_language: 'es',
        target_language: 'en',
        name: 'Spanish for Beginners',
        description: 'Learn basic Spanish vocabulary and grammar',
        is_public: true
      };

      const result = CourseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid course data', () => {
      const invalidData = [
        { // Same source and target language
          id: 'es-es-beginner',
          source_language: 'es',
          target_language: 'es',
          name: 'Spanish for Beginners'
        },
        { // Invalid ID format
          id: 'Invalid ID with spaces',
          source_language: 'es',
          target_language: 'en',
          name: 'Spanish for Beginners'
        },
        { // Invalid language code
          id: 'es-en-beginner',
          source_language: 'esp', // Too long
          target_language: 'en',
          name: 'Spanish for Beginners'
        }
      ];

      invalidData.forEach(data => {
        const result = CourseSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('LessonSchema', () => {
    it('should validate valid lesson data', () => {
      const validData = {
        id: 'lesson-123',
        experience_points: 10,
        order: 1
      };

      const result = LessonSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid lesson data', () => {
      const invalidData = [
        { // Invalid ID format
          id: 'Lesson ID with spaces',
          experience_points: 10,
          order: 1
        },
        { // Negative experience points
          id: 'lesson-123',
          experience_points: -5,
          order: 1
        },
        { // Zero order (must be positive)
          id: 'lesson-123',
          experience_points: 10,
          order: 0
        }
      ];

      invalidData.forEach(data => {
        const result = LessonSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('ExerciseSchema', () => {
    it('should validate valid exercise data', () => {
      const validData = {
        id: 'ex-123',
        exercise_type: 'translation',
        data: {
          source_text: 'Hello',
          target_text: 'Hola',
          hints: ['greeting']
        }
      };

      const result = ExerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid exercise data', () => {
      const invalidData = [
        { // Invalid ID format
          id: 'Exercise ID with spaces',
          exercise_type: 'translation',
          data: { source_text: 'Hello', target_text: 'Hola' }
        },
        { // Invalid exercise type
          id: 'ex-123',
          exercise_type: 'invalid-type',
          data: { source_text: 'Hello', target_text: 'Hola' }
        }
      ];

      invalidData.forEach(data => {
        const result = ExerciseSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('ProgressSyncSchema', () => {
    it('should validate valid progress sync data', () => {
      const validData = {
        completions: [
          {
            lesson_id: 'lesson-123',
            completed_at: '2024-01-20T10:30:00Z',
            score: 85,
            time_spent_seconds: 300
          }
        ],
        experience_gained: 50,
        last_activity: '2024-01-20T10:35:00Z'
      };

      const result = ProgressSyncSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid progress sync data', () => {
      const invalidData = [
        { // Empty completions array
          completions: [],
          experience_gained: 50
        },
        { // Invalid lesson completion
          completions: [
            {
              lesson_id: 'lesson-123',
              completed_at: 'invalid-date', // Invalid date format
              score: 85
            }
          ],
          experience_gained: 50
        },
        { // Invalid score
          completions: [
            {
              lesson_id: 'lesson-123',
              completed_at: '2024-01-20T10:30:00Z',
              score: 101 // Score > 100
            }
          ],
          experience_gained: 50
        }
      ];

      invalidData.forEach(data => {
        const result = ProgressSyncSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });
});