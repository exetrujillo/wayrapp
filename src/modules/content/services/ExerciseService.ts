import { PrismaClient } from '@prisma/client';
import { ExerciseRepository } from '../repositories';
import { 
  Exercise, 
  CreateExerciseDto
} from '../types';
import { PaginatedResult, QueryOptions } from '../../../shared/types';

export class ExerciseService {
  private exerciseRepository: ExerciseRepository;

  constructor(prisma: PrismaClient) {
    this.exerciseRepository = new ExerciseRepository(prisma);
  }

  async createExercise(data: CreateExerciseDto): Promise<Exercise> {
    // Check if exercise with same ID already exists
    const existingExercise = await this.exerciseRepository.exists(data.id);
    if (existingExercise) {
      throw new Error(`Exercise with ID '${data.id}' already exists`);
    }

    // Validate exercise data based on type
    this.validateExerciseData(data.exercise_type, data.data);

    return await this.exerciseRepository.create(data);
  }

  async getExercise(id: string): Promise<Exercise> {
    const exercise = await this.exerciseRepository.findById(id);
    if (!exercise) {
      throw new Error(`Exercise with ID '${id}' not found`);
    }
    return exercise;
  }

  async getExercises(options: QueryOptions = {}): Promise<PaginatedResult<Exercise>> {
    return await this.exerciseRepository.findAll(options);
  }

  async getExercisesByType(exerciseType: string, options: QueryOptions = {}): Promise<PaginatedResult<Exercise>> {
    // Validate exercise type
    const validTypes = ['translation', 'fill-in-the-blank', 'vof', 'pairs', 'informative', 'ordering'];
    if (!validTypes.includes(exerciseType)) {
      throw new Error(`Invalid exercise type '${exerciseType}'. Valid types: ${validTypes.join(', ')}`);
    }

    return await this.exerciseRepository.findByType(exerciseType, options);
  }

  async updateExercise(id: string, data: Partial<CreateExerciseDto>): Promise<Exercise> {
    // Check if exercise exists
    const existingExercise = await this.exerciseRepository.exists(id);
    if (!existingExercise) {
      throw new Error(`Exercise with ID '${id}' not found`);
    }

    // Validate exercise data if provided
    if (data.exercise_type && data.data) {
      this.validateExerciseData(data.exercise_type, data.data);
    } else if (data.data) {
      // If only data is provided, get current exercise to validate against its type
      const currentExercise = await this.exerciseRepository.findById(id);
      if (currentExercise) {
        this.validateExerciseData(currentExercise.exercise_type, data.data);
      }
    }

    return await this.exerciseRepository.update(id, data);
  }

  async deleteExercise(id: string): Promise<void> {
    const existingExercise = await this.exerciseRepository.exists(id);
    if (!existingExercise) {
      throw new Error(`Exercise with ID '${id}' not found`);
    }

    const success = await this.exerciseRepository.delete(id);
    if (!success) {
      throw new Error(`Failed to delete exercise with ID '${id}'`);
    }
  }

  async getExercisesByIds(ids: string[]): Promise<Exercise[]> {
    if (ids.length === 0) {
      return [];
    }

    return await this.exerciseRepository.findByIds(ids);
  }

  private validateExerciseData(exerciseType: string, data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Exercise data must be a valid object');
    }

    switch (exerciseType) {
      case 'translation':
        this.validateTranslationData(data);
        break;
      case 'fill-in-the-blank':
        this.validateFillInTheBlankData(data);
        break;
      case 'vof':
        this.validateVofData(data);
        break;
      case 'pairs':
        this.validatePairsData(data);
        break;
      case 'informative':
        this.validateInformativeData(data);
        break;
      case 'ordering':
        this.validateOrderingData(data);
        break;
      default:
        throw new Error(`Unknown exercise type: ${exerciseType}`);
    }
  }

  private validateTranslationData(data: any): void {
    if (!data.source_text || typeof data.source_text !== 'string') {
      throw new Error('Translation exercise must have a valid source_text');
    }
    if (!data.target_text || typeof data.target_text !== 'string') {
      throw new Error('Translation exercise must have a valid target_text');
    }
    if (data.hints && !Array.isArray(data.hints)) {
      throw new Error('Translation exercise hints must be an array');
    }
  }

  private validateFillInTheBlankData(data: any): void {
    if (!data.text || typeof data.text !== 'string') {
      throw new Error('Fill-in-the-blank exercise must have a valid text');
    }
    if (!data.blanks || !Array.isArray(data.blanks)) {
      throw new Error('Fill-in-the-blank exercise must have a valid blanks array');
    }
    
    data.blanks.forEach((blank: any, index: number) => {
      if (typeof blank.position !== 'number') {
        throw new Error(`Blank at index ${index} must have a valid position number`);
      }
      if (!blank.correct_answers || !Array.isArray(blank.correct_answers) || blank.correct_answers.length === 0) {
        throw new Error(`Blank at index ${index} must have at least one correct answer`);
      }
      if (blank.hints && !Array.isArray(blank.hints)) {
        throw new Error(`Blank at index ${index} hints must be an array`);
      }
    });
  }

  private validateVofData(data: any): void {
    if (!data.statement || typeof data.statement !== 'string') {
      throw new Error('VOF exercise must have a valid statement');
    }
    if (typeof data.is_true !== 'boolean') {
      throw new Error('VOF exercise must have a valid is_true boolean value');
    }
    if (data.explanation && typeof data.explanation !== 'string') {
      throw new Error('VOF exercise explanation must be a string');
    }
  }

  private validatePairsData(data: any): void {
    if (!data.pairs || !Array.isArray(data.pairs)) {
      throw new Error('Pairs exercise must have a valid pairs array');
    }
    if (data.pairs.length === 0) {
      throw new Error('Pairs exercise must have at least one pair');
    }
    
    data.pairs.forEach((pair: any, index: number) => {
      if (!pair.left || typeof pair.left !== 'string') {
        throw new Error(`Pair at index ${index} must have a valid left value`);
      }
      if (!pair.right || typeof pair.right !== 'string') {
        throw new Error(`Pair at index ${index} must have a valid right value`);
      }
    });
  }

  private validateInformativeData(data: any): void {
    if (!data.content || typeof data.content !== 'string') {
      throw new Error('Informative exercise must have valid content');
    }
    if (data.title && typeof data.title !== 'string') {
      throw new Error('Informative exercise title must be a string');
    }
  }

  private validateOrderingData(data: any): void {
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Ordering exercise must have a valid items array');
    }
    if (data.items.length < 2) {
      throw new Error('Ordering exercise must have at least 2 items');
    }
    
    data.items.forEach((item: any, index: number) => {
      if (!item.text || typeof item.text !== 'string') {
        throw new Error(`Item at index ${index} must have valid text`);
      }
      if (typeof item.correct_order !== 'number') {
        throw new Error(`Item at index ${index} must have a valid correct_order number`);
      }
    });

    // Validate that correct_order values form a valid sequence
    const orders = data.items.map((item: any) => item.correct_order).sort((a: number, b: number) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        throw new Error('Ordering exercise correct_order values must form a sequence starting from 1');
      }
    }
  }
}