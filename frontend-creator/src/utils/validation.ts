import { z } from 'zod';

// Enhanced validation utilities
export const createFieldValidator = (fieldName: string) => ({
  required: (message?: string) => z.string().min(1, message || `${fieldName} is required`),
  minLength: (min: number, message?: string) => z.string().min(min, message || `${fieldName} must be at least ${min} characters`),
  maxLength: (max: number, message?: string) => z.string().max(max, message || `${fieldName} must not exceed ${max} characters`),
  email: (message?: string) => z.string().email(message || 'Please enter a valid email address'),
  url: (message?: string) => z.string().url(message || 'Please enter a valid URL'),
  regex: (pattern: RegExp, message: string) => z.string().regex(pattern, message),
});

// Enhanced number validation
export const createNumberValidator = (fieldName: string) => ({
  required: (message?: string) => z.number({ required_error: message || `${fieldName} is required` }),
  positive: (message?: string) => z.number().positive(message || `${fieldName} must be a positive number`),
  nonNegative: (message?: string) => z.number().nonnegative(message || `${fieldName} must be non-negative`),
  min: (min: number, message?: string) => z.number().min(min, message || `${fieldName} must be at least ${min}`),
  max: (max: number, message?: string) => z.number().max(max, message || `${fieldName} must not exceed ${max}`),
  int: (message?: string) => z.number().int(message || `${fieldName} must be a whole number`),
});

// Login form schema
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

// Course creation schema - matches backend API requirements with enhanced validation
export const courseSchema = z.object({
  id: z.string()
    .min(1, 'Course ID is required')
    .max(20, 'Course ID must be 20 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Course ID can only contain lowercase letters, numbers, and hyphens')
    .refine(val => !val.startsWith('-') && !val.endsWith('-'), 'Course ID cannot start or end with a hyphen')
    .refine(val => !val.includes('--'), 'Course ID cannot contain consecutive hyphens')
    .optional(), // Make ID optional since it's auto-generated
  name: z.string()
    .min(1, 'Course name is required')
    .max(100, 'Course name must be 100 characters or less')
    .refine(val => val.trim().length > 0, 'Course name cannot be only whitespace'),
  sourceLanguage: z.string()
    .min(2, 'Source language code must be at least 2 characters')
    .max(20, 'Source language code must not exceed 20 characters')
    .regex(/^[a-z]{2,3}(-[A-Z]{2}|-[0-9]{3})?$/, 'Source language must follow BCP 47 format (e.g., "en", "qu", "es-ES", "es-419")'),
  targetLanguage: z.string()
    .min(2, 'Target language code must be at least 2 characters')
    .max(20, 'Target language code must not exceed 20 characters')
    .regex(/^[a-z]{2,3}(-[A-Z]{2}|-[0-9]{3})?$/, 'Target language must follow BCP 47 format (e.g., "en", "qu", "es-ES", "es-419")'),
  description: z.string()
    .max(255, 'Description cannot exceed 255 characters')
    .optional()
    .or(z.literal('')),
  isPublic: z.boolean(),
}).refine(data => data.sourceLanguage !== data.targetLanguage, {
  message: 'Source and target languages must be different',
  path: ['targetLanguage'],
});

// Schema for course creation with auto-generated ID
export const courseCreationSchema = z.object({
  name: z.string()
    .min(1, 'Course name is required')
    .max(100, 'Course name must be 100 characters or less')
    .refine(val => val.trim().length > 0, 'Course name cannot be only whitespace'),
  sourceLanguage: z.string()
    .min(2, 'Source language code must be at least 2 characters')
    .max(20, 'Source language code must not exceed 20 characters')
    .regex(/^[a-z]{2,3}(-[A-Z]{2}|-[0-9]{3})?$/, 'Source language must follow BCP 47 format (e.g., "en", "qu", "es-ES", "es-419")'),
  targetLanguage: z.string()
    .min(2, 'Target language code must be at least 2 characters')
    .max(20, 'Target language code must not exceed 20 characters')
    .regex(/^[a-z]{2,3}(-[A-Z]{2}|-[0-9]{3})?$/, 'Target language must follow BCP 47 format (e.g., "en", "qu", "es-ES", "es-419")'),
  description: z.string()
    .max(255, 'Description cannot exceed 255 characters')
    .optional()
    .or(z.literal('')),
  isPublic: z.boolean(),
}).refine(data => data.sourceLanguage !== data.targetLanguage, {
  message: 'Source and target languages must be different',
  path: ['targetLanguage'],
});

// Level creation schema with enhanced validation
export const levelSchema = z.object({
  code: z.string()
    .min(1, 'Level code is required')
    .max(10, 'Level code must be 10 characters or less')
    .regex(/^[A-Z0-9]+$/, 'Level code must contain only uppercase letters and numbers')
    .refine(val => val.trim().length > 0, 'Level code cannot be only whitespace'),
  name: z.string()
    .min(3, 'Level name must be at least 3 characters')
    .max(100, 'Level name must be 100 characters or less')
    .refine(val => val.trim().length >= 3, 'Level name must be at least 3 characters (excluding whitespace)'),
  order: z.number()
    .int('Order must be a whole number')
    .min(1, 'Order must be at least 1')
    .max(999, 'Order cannot exceed 999'),
});

// Section creation schema with enhanced validation
export const sectionSchema = z.object({
  id: z.string()
    .min(1, 'Section ID is required')
    .max(40, 'Section ID must be 40 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Section ID must contain only lowercase letters, numbers, and hyphens')
    .refine(val => val.trim().length > 0, 'Section ID cannot be only whitespace'),
  name: z.string()
    .min(3, 'Section name must be at least 3 characters')
    .max(150, 'Section name must be 150 characters or less')
    .refine(val => val.trim().length >= 3, 'Section name must be at least 3 characters (excluding whitespace)'),
  order: z.number()
    .int('Order must be a whole number')
    .min(1, 'Order must be at least 1')
    .max(999, 'Order cannot exceed 999'),
});

// Module creation schema with enhanced validation
export const moduleSchema = z.object({
  moduleType: z.enum(['informative', 'basic_lesson', 'reading', 'dialogue', 'exam'], {
    errorMap: () => ({ message: 'Please select a valid module type' }),
  }),
  name: z.string()
    .min(3, 'Module name must be at least 3 characters')
    .max(150, 'Module name must be 150 characters or less')
    .refine(val => val.trim().length >= 3, 'Module name must be at least 3 characters (excluding whitespace)'),
  order: z.number()
    .int('Order must be a whole number')
    .nonnegative('Order must be a non-negative number')
    .max(999, 'Order cannot exceed 999'),
});

// Lesson creation schema with enhanced validation
export const lessonSchema = z.object({
  experiencePoints: z.number()
    .int('Experience points must be a whole number')
    .positive('Experience points must be a positive number')
    .min(1, 'Experience points must be at least 1')
    .max(1000, 'Experience points cannot exceed 1000'),
  order: z.number()
    .int('Order must be a whole number')
    .nonnegative('Order must be a non-negative number')
    .max(999, 'Order cannot exceed 999'),
});

// Exercise type-specific data schemas with enhanced validation
export const translationExerciseDataSchema = z.object({
  source_text: z.string()
    .min(1, 'Source text is required')
    .max(1000, 'Source text cannot exceed 1000 characters')
    .refine(val => val.trim().length > 0, 'Source text cannot be only whitespace'),
  target_text: z.string()
    .min(1, 'Target text is required')
    .max(1000, 'Target text cannot exceed 1000 characters')
    .refine(val => val.trim().length > 0, 'Target text cannot be only whitespace'),
  hints: z.array(z.string().min(1, 'Hint cannot be empty').max(200, 'Hint cannot exceed 200 characters')).optional(),
});

export const fillInTheBlankExerciseDataSchema = z.object({
  text: z.string()
    .min(1, 'Text with blanks is required')
    .max(2000, 'Text cannot exceed 2000 characters')
    .refine(val => val.trim().length > 0, 'Text cannot be only whitespace'),
  blanks: z.array(z.object({
    position: z.number()
      .int('Position must be a whole number')
      .nonnegative('Position must be non-negative'),
    correctAnswers: z.array(
      z.string()
        .min(1, 'Answer cannot be empty')
        .max(100, 'Answer cannot exceed 100 characters')
        .refine(val => val.trim().length > 0, 'Answer cannot be only whitespace')
    ).min(1, 'At least one correct answer is required')
     .max(10, 'Cannot have more than 10 correct answers per blank'),
    hints: z.array(z.string().min(1, 'Hint cannot be empty').max(200, 'Hint cannot exceed 200 characters')).optional(),
  })).min(1, 'At least one blank is required').max(20, 'Cannot have more than 20 blanks'),
});

export const vofExerciseDataSchema = z.object({
  statement: z.string()
    .min(1, 'Statement is required')
    .max(1000, 'Statement cannot exceed 1000 characters')
    .refine(val => val.trim().length > 0, 'Statement cannot be only whitespace'),
  isTrue: z.boolean(),
  explanation: z.string()
    .max(500, 'Explanation cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
});

export const pairsExerciseDataSchema = z.object({
  pairs: z.array(z.object({
    left: z.string()
      .min(1, 'Left item is required')
      .max(200, 'Left item cannot exceed 200 characters')
      .refine(val => val.trim().length > 0, 'Left item cannot be only whitespace'),
    right: z.string()
      .min(1, 'Right item is required')
      .max(200, 'Right item cannot exceed 200 characters')
      .refine(val => val.trim().length > 0, 'Right item cannot be only whitespace'),
  })).min(2, 'At least two pairs are required').max(15, 'Cannot have more than 15 pairs'),
});

export const orderingExerciseDataSchema = z.object({
  items: z.array(z.object({
    id: z.string().min(1, 'Item ID is required'),
    text: z.string()
      .min(1, 'Item text is required')
      .max(300, 'Item text cannot exceed 300 characters')
      .refine(val => val.trim().length > 0, 'Item text cannot be only whitespace'),
  })).min(2, 'At least two items are required').max(10, 'Cannot have more than 10 items'),
});

export const informativeExerciseDataSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .refine(val => val.trim().length > 0, 'Title cannot be only whitespace'),
  content: z.string()
    .min(1, 'Content is required')
    .max(5000, 'Content cannot exceed 5000 characters')
    .refine(val => val.trim().length > 0, 'Content cannot be only whitespace'),
  media: z.object({
    type: z.enum(['image', 'video', 'audio'], {
      errorMap: () => ({ message: 'Media type must be image, video, or audio' }),
    }),
    url: z.string()
      .url('Must be a valid URL')
      .max(500, 'URL cannot exceed 500 characters'),
    alt: z.string()
      .max(200, 'Alt text cannot exceed 200 characters')
      .optional()
      .or(z.literal('')),
  }).optional(),
});

// Dynamic exercise data schema based on exercise type
export const getExerciseDataSchema = (exerciseType: string) => {
  switch (exerciseType) {
    case 'translation':
      return translationExerciseDataSchema;
    case 'fill-in-the-blank':
      return fillInTheBlankExerciseDataSchema;
    case 'vof':
      return vofExerciseDataSchema;
    case 'pairs':
      return pairsExerciseDataSchema;
    case 'ordering':
      return orderingExerciseDataSchema;
    case 'informative':
      return informativeExerciseDataSchema;
    default:
      return z.record(z.unknown());
  }
};

// Exercise creation schema with dynamic validation
export const exerciseSchema = z.object({
  id: z.string().optional(),
  exerciseType: z.enum([
    'translation',
    'fill-in-the-blank',
    'vof',
    'pairs',
    'informative',
    'ordering'
  ]),
  data: z.record(z.unknown()),
}).refine((data) => {
  try {
    const dataSchema = getExerciseDataSchema(data.exerciseType);
    dataSchema.parse(data.data);
    return true;
  } catch {
    return false;
  }
}, {
  message: 'Exercise data does not match the required format for the selected exercise type',
  path: ['data'],
});

// Exercise assignment schema with enhanced validation
export const exerciseAssignmentSchema = z.object({
  lessonId: z.string()
    .min(1, 'Lesson ID is required')
    .max(50, 'Lesson ID cannot exceed 50 characters'),
  exercise_id: z.string()
    .min(1, 'Exercise ID is required')
    .max(50, 'Exercise ID cannot exceed 50 characters'),
  order: z.number()
    .int('Order must be a whole number')
    .nonnegative('Order must be non-negative')
    .max(999, 'Order cannot exceed 999'),
});

// Form validation state management utilities
export interface ValidationState {
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
}

export const createInitialValidationState = (): ValidationState => ({
  isValid: false,
  errors: {},
  touched: {},
  isSubmitting: false,
});

// Real-time validation helpers
export const validateField = async (
  schema: z.ZodSchema,
  fieldName: string,
  value: any,
  allData?: any
): Promise<string | null> => {
  try {
    if (allData) {
      // Validate the entire object but only return error for specific field
      await schema.parseAsync(allData);
    } else {
      // For single field validation, create a partial object and validate
      const partialData = { [fieldName]: value };
      // Use safeParse for single field validation
      const result = schema.safeParse(partialData);
      if (!result.success) {
        const fieldError = result.error.errors.find(err => 
          err.path.length === 1 && err.path[0] === fieldName
        );
        return fieldError?.message || null;
      }
    }
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.errors.find(err => 
        err.path.length === 1 && err.path[0] === fieldName
      );
      return fieldError?.message || null;
    }
    return 'Validation error';
  }
};

// Debounced validation for real-time feedback
export const createDebouncedValidator = (
  validateFn: (value: any) => Promise<string | null>,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;
  
  return (value: any): Promise<string | null> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await validateFn(value);
        resolve(result);
      }, delay);
    });
  };
};

// Form submission state helpers
export const createSubmissionHandlers = (
  onSubmissionStart: () => void,
  onSubmissionEnd: () => void,
  onSuccess: (data: any) => void,
  onError: (error: string) => void
) => ({
  handleSubmissionStart: () => {
    onSubmissionStart();
  },
  handleSubmissionEnd: () => {
    onSubmissionEnd();
  },
  handleSubmissionSuccess: (data: any) => {
    onSubmissionEnd();
    onSuccess(data);
  },
  handleSubmissionError: (error: any) => {
    onSubmissionEnd();
    const errorMessage = error?.message || error?.response?.data?.message || 'An error occurred';
    onError(errorMessage);
  },
});

// Enhanced error message formatting
export const formatValidationError = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });
  
  return errors;
};

// Success message helpers
export const getSuccessMessage = (
  operation: 'create' | 'update' | 'delete',
  entityType: string,
  entityName?: string
): string => {
  const entity = entityName ? `${entityType} "${entityName}"` : entityType;
  
  switch (operation) {
    case 'create':
      return `${entity} created successfully!`;
    case 'update':
      return `${entity} updated successfully!`;
    case 'delete':
      return `${entity} deleted successfully!`;
    default:
      return 'Operation completed successfully!';
  }
};

export type LoginFormData = z.infer<typeof loginSchema>;
export type CourseFormData = z.infer<typeof courseSchema>;
export type CourseCreationFormData = z.infer<typeof courseCreationSchema>;
export type LevelFormData = z.infer<typeof levelSchema>;
export type SectionFormData = z.infer<typeof sectionSchema>;
export type ModuleFormData = z.infer<typeof moduleSchema>;
export type LessonFormData = z.infer<typeof lessonSchema>;
export type ExerciseFormData = z.infer<typeof exerciseSchema>;
export type ExerciseAssignmentFormData = z.infer<typeof exerciseAssignmentSchema>;