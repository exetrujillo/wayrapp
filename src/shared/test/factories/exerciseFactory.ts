/**
 * Exercise Factory for Test Data Generation
 * Creates test exercise data with customizable properties
 */
import { Exercise, ExerciseType } from '@prisma/client';

export class ExerciseFactory {
  /**
   * Build a basic exercise with default or custom properties
   */
  static build(overrides: Partial<Exercise> = {}): Omit<Exercise, 'createdAt' | 'updatedAt'> {
    const exerciseId = `ex-${Math.floor(Math.random() * 100000)}`;
    
    const defaultExercise = {
      id: exerciseId,
      exerciseType: 'translation' as ExerciseType,
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
  
  /**
   * Build a translation exercise
   */
  static buildTranslation(overrides: Partial<Exercise> = {}): Omit<Exercise, 'createdAt' | 'updatedAt'> {
    return this.build({
      exerciseType: 'translation',
      data: {
        source_text: 'Hello, how are you?',
        target_text: 'Hola, ¿cómo estás?',
        hints: ['greeting', 'question']
      },
      ...overrides,
    });
  }
  
  /**
   * Build a fill-in-the-blank exercise
   */
  static buildFillInTheBlank(overrides: Partial<Exercise> = {}): Omit<Exercise, 'createdAt' | 'updatedAt'> {
    return this.build({
      exerciseType: 'fill_in_the_blank',
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
  
  /**
   * Build a true/false (vof) exercise
   */
  static buildVof(overrides: Partial<Exercise> = {}): Omit<Exercise, 'createdAt' | 'updatedAt'> {
    return this.build({
      exerciseType: 'vof',
      data: {
        statement: 'Spanish is spoken in Mexico.',
        is_true: true,
        explanation: 'Spanish is the official language of Mexico.'
      },
      ...overrides,
    });
  }
  
  /**
   * Build a pairs matching exercise
   */
  static buildPairs(overrides: Partial<Exercise> = {}): Omit<Exercise, 'createdAt' | 'updatedAt'> {
    return this.build({
      exerciseType: 'pairs',
      data: {
        pairs: [
          { left: 'dog', right: 'perro' },
          { left: 'cat', right: 'gato' },
          { left: 'house', right: 'casa' }
        ]
      },
      ...overrides,
    });
  }
  
  /**
   * Build an informative exercise
   */
  static buildInformative(overrides: Partial<Exercise> = {}): Omit<Exercise, 'createdAt' | 'updatedAt'> {
    return this.build({
      exerciseType: 'informative',
      data: {
        title: 'Spanish Greetings',
        content: 'In Spanish, "hello" is "hola" and "goodbye" is "adiós".',
        media_url: 'https://example.com/spanish-greetings.jpg'
      },
      ...overrides,
    });
  }
  
  /**
   * Build an ordering exercise
   */
  static buildOrdering(overrides: Partial<Exercise> = {}): Omit<Exercise, 'createdAt' | 'updatedAt'> {
    return this.build({
      exerciseType: 'ordering',
      data: {
        instruction: 'Order the words to form a correct sentence.',
        items: ['I', 'speak', 'Spanish', 'well'],
        correct_order: [0, 1, 2, 3]
      },
      ...overrides,
    });
  }
}