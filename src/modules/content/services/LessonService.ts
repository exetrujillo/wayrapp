import { PrismaClient } from '@prisma/client';
import { LessonRepository, ExerciseRepository, ModuleRepository } from '../repositories';
import { 
  Lesson, 
  CreateLessonDto,
  LessonExercise,
  AssignExerciseToLessonDto
} from '../types';
import { PaginatedResult, QueryOptions } from '../../../shared/types';

export class LessonService {
  private lessonRepository: LessonRepository;
  private exerciseRepository: ExerciseRepository;
  private moduleRepository: ModuleRepository;

  constructor(prisma: PrismaClient) {
    this.lessonRepository = new LessonRepository(prisma);
    this.exerciseRepository = new ExerciseRepository(prisma);
    this.moduleRepository = new ModuleRepository(prisma);
  }

  async createLesson(data: CreateLessonDto): Promise<Lesson> {
    // Check if parent module exists
    const moduleExists = await this.moduleRepository.exists(data.module_id);
    if (!moduleExists) {
      throw new Error(`Module with ID '${data.module_id}' not found`);
    }

    // Check if lesson with same ID already exists
    const existingLesson = await this.lessonRepository.exists(data.id);
    if (existingLesson) {
      throw new Error(`Lesson with ID '${data.id}' already exists`);
    }

    // Check if order already exists in the module
    const orderExists = await this.moduleRepository.existsLessonOrderInModule(data.module_id, data.order);
    if (orderExists) {
      throw new Error(`Lesson with order '${data.order}' already exists in module '${data.module_id}'`);
    }

    return await this.lessonRepository.create(data);
  }

  async getLesson(id: string): Promise<Lesson> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new Error(`Lesson with ID '${id}' not found`);
    }
    return lesson;
  }

  async getLessonsByModule(moduleId: string, options: QueryOptions = {}): Promise<PaginatedResult<Lesson>> {
    // Check if module exists
    const moduleExists = await this.moduleRepository.exists(moduleId);
    if (!moduleExists) {
      throw new Error(`Module with ID '${moduleId}' not found`);
    }

    return await this.lessonRepository.findByModuleId(moduleId, options);
  }

  async getLessons(options: QueryOptions = {}): Promise<PaginatedResult<Lesson>> {
    return await this.lessonRepository.findAll(options);
  }

  async updateLesson(id: string, data: Partial<Omit<CreateLessonDto, 'id' | 'module_id'>>): Promise<Lesson> {
    // Check if lesson exists
    const existingLesson = await this.lessonRepository.findById(id);
    if (!existingLesson) {
      throw new Error(`Lesson with ID '${id}' not found`);
    }

    // Check if new order conflicts with existing lessons in the same module
    if (data.order !== undefined) {
      const orderExists = await this.moduleRepository.existsLessonOrderInModule(existingLesson.module_id, data.order, id);
      if (orderExists) {
        throw new Error(`Lesson with order '${data.order}' already exists in module '${existingLesson.module_id}'`);
      }
    }

    return await this.lessonRepository.update(id, data);
  }

  async deleteLesson(id: string): Promise<void> {
    const existingLesson = await this.lessonRepository.exists(id);
    if (!existingLesson) {
      throw new Error(`Lesson with ID '${id}' not found`);
    }

    const success = await this.lessonRepository.delete(id);
    if (!success) {
      throw new Error(`Failed to delete lesson with ID '${id}'`);
    }
  }

  // Lesson-Exercise assignment operations
  async assignExerciseToLesson(lessonId: string, data: AssignExerciseToLessonDto): Promise<LessonExercise> {
    // Check if lesson exists
    const lessonExists = await this.lessonRepository.exists(lessonId);
    if (!lessonExists) {
      throw new Error(`Lesson with ID '${lessonId}' not found`);
    }

    // Check if exercise exists
    const exerciseExists = await this.exerciseRepository.exists(data.exercise_id);
    if (!exerciseExists) {
      throw new Error(`Exercise with ID '${data.exercise_id}' not found`);
    }

    // Check if exercise is already assigned to this lesson
    const existingAssignment = await this.lessonRepository.getLessonExercises(lessonId);
    const alreadyAssigned = existingAssignment.some(le => le.exercise_id === data.exercise_id);
    if (alreadyAssigned) {
      throw new Error(`Exercise '${data.exercise_id}' is already assigned to lesson '${lessonId}'`);
    }

    // Check if order already exists for this lesson
    const orderExists = existingAssignment.some(le => le.order === data.order);
    if (orderExists) {
      throw new Error(`Exercise with order '${data.order}' already exists in lesson '${lessonId}'`);
    }

    return await this.lessonRepository.assignExercise(lessonId, data.exercise_id, data.order);
  }

  async unassignExerciseFromLesson(lessonId: string, exerciseId: string): Promise<void> {
    // Check if lesson exists
    const lessonExists = await this.lessonRepository.exists(lessonId);
    if (!lessonExists) {
      throw new Error(`Lesson with ID '${lessonId}' not found`);
    }

    // Check if exercise exists
    const exerciseExists = await this.exerciseRepository.exists(exerciseId);
    if (!exerciseExists) {
      throw new Error(`Exercise with ID '${exerciseId}' not found`);
    }

    // Check if exercise is assigned to this lesson
    const existingAssignment = await this.lessonRepository.getLessonExercises(lessonId);
    const isAssigned = existingAssignment.some(le => le.exercise_id === exerciseId);
    if (!isAssigned) {
      throw new Error(`Exercise '${exerciseId}' is not assigned to lesson '${lessonId}'`);
    }

    const success = await this.lessonRepository.unassignExercise(lessonId, exerciseId);
    if (!success) {
      throw new Error(`Failed to unassign exercise '${exerciseId}' from lesson '${lessonId}'`);
    }
  }

  async getLessonExercises(lessonId: string): Promise<LessonExercise[]> {
    // Check if lesson exists
    const lessonExists = await this.lessonRepository.exists(lessonId);
    if (!lessonExists) {
      throw new Error(`Lesson with ID '${lessonId}' not found`);
    }

    return await this.lessonRepository.getLessonExercises(lessonId);
  }

  async reorderLessonExercises(lessonId: string, exerciseIds: string[]): Promise<void> {
    // Check if lesson exists
    const lessonExists = await this.lessonRepository.exists(lessonId);
    if (!lessonExists) {
      throw new Error(`Lesson with ID '${lessonId}' not found`);
    }

    // Get current lesson exercises
    const currentExercises = await this.lessonRepository.getLessonExercises(lessonId);
    
    // Validate that all provided exercise IDs are currently assigned to this lesson
    const currentExerciseIds = currentExercises.map(le => le.exercise_id);
    const missingExercises = exerciseIds.filter(id => !currentExerciseIds.includes(id));
    if (missingExercises.length > 0) {
      throw new Error(`Exercises not assigned to lesson '${lessonId}': ${missingExercises.join(', ')}`);
    }

    // Validate that all currently assigned exercises are included in the reorder
    const extraExercises = currentExerciseIds.filter(id => !exerciseIds.includes(id));
    if (extraExercises.length > 0) {
      throw new Error(`Missing exercises in reorder for lesson '${lessonId}': ${extraExercises.join(', ')}`);
    }

    // Validate no duplicates in the provided list
    const uniqueIds = new Set(exerciseIds);
    if (uniqueIds.size !== exerciseIds.length) {
      throw new Error('Duplicate exercise IDs provided in reorder list');
    }

    const success = await this.lessonRepository.reorderExercises(lessonId, exerciseIds);
    if (!success) {
      throw new Error(`Failed to reorder exercises for lesson '${lessonId}'`);
    }
  }
}