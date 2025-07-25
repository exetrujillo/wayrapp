import { courseService } from '../courseService';
import apiClient from '../api';
import { Course, CreateCourseRequest, UpdateCourseRequest, PaginationParams } from '../../utils/types';

// Mock the API client
jest.mock('../api');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('CourseService', () => {
  const mockCourse: Course = {
    id: 'test-course-1',
    name: 'Test Spanish Course',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    description: 'A comprehensive Spanish learning course',
    isPublic: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockPaginatedResponse = {
    data: [mockCourse],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCourses', () => {
    it('should fetch courses successfully', async () => {
      mockApiClient.get.mockResolvedValue(mockPaginatedResponse);

      const result = await courseService.getCourses();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/courses', { params: undefined });
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should fetch courses with pagination parameters', async () => {
      const params: PaginationParams = { page: 2, limit: 20 };
      mockApiClient.get.mockResolvedValue(mockPaginatedResponse);

      const result = await courseService.getCourses(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/courses', { params });
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle invalid response format', async () => {
      mockApiClient.get.mockResolvedValue({ data: null });

      await expect(courseService.getCourses()).rejects.toThrow('Invalid response format from courses API');
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(courseService.getCourses()).rejects.toThrow('Network error');
    });

    it('should handle unknown errors', async () => {
      mockApiClient.get.mockRejectedValue('Unknown error');

      await expect(courseService.getCourses()).rejects.toThrow('Failed to fetch courses. Please try again later.');
    });
  });

  describe('getCourse', () => {
    it('should fetch a single course successfully', async () => {
      mockApiClient.get.mockResolvedValue(mockCourse);

      const result = await courseService.getCourse('test-course-1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/courses/test-course-1');
      expect(result).toEqual(mockCourse);
    });

    it('should validate course ID parameter', async () => {
      await expect(courseService.getCourse('')).rejects.toThrow('Course ID is required and must be a string');
      await expect(courseService.getCourse(null as any)).rejects.toThrow('Course ID is required and must be a string');
    });

    it('should handle 404 errors', async () => {
      const error = { status: 404 };
      mockApiClient.get.mockRejectedValue(error);

      await expect(courseService.getCourse('nonexistent')).rejects.toThrow('Course with ID nonexistent not found');
    });

    it('should handle 403 errors', async () => {
      const error = { status: 403 };
      mockApiClient.get.mockRejectedValue(error);

      await expect(courseService.getCourse('test-course-1')).rejects.toThrow('You do not have permission to access this course');
    });

    it('should handle invalid response data', async () => {
      mockApiClient.get.mockResolvedValue({ name: 'Course without ID' });

      await expect(courseService.getCourse('test-course-1')).rejects.toThrow('Invalid course data received from API');
    });
  });

  describe('createCourse', () => {
    const createCourseData: CreateCourseRequest = {
      id: 'new-course',
      name: 'New Course',
      source_language: 'en',
      target_language: 'es',
      description: 'New course description',
      is_public: true,
    };

    it('should create a course successfully', async () => {
      mockApiClient.post.mockResolvedValue(mockCourse);

      const result = await courseService.createCourse(createCourseData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/v1/courses', createCourseData);
      expect(result).toEqual(mockCourse);
    });

    it('should validate required fields', async () => {
      const invalidData = { name: '', source_language: '', target_language: '' } as CreateCourseRequest;

      await expect(courseService.createCourse(invalidData)).rejects.toThrow('Course name, source language, and target language are required');
    });

    it('should handle 400 validation errors', async () => {
      const error = { status: 400, message: 'Invalid data' };
      mockApiClient.post.mockRejectedValue(error);

      await expect(courseService.createCourse(createCourseData)).rejects.toThrow('Invalid data');
    });

    it('should handle 409 conflict errors', async () => {
      const error = { status: 409 };
      mockApiClient.post.mockRejectedValue(error);

      await expect(courseService.createCourse(createCourseData)).rejects.toThrow('A course with this name already exists');
    });

    it('should handle invalid response', async () => {
      mockApiClient.post.mockResolvedValue({ name: 'Course without ID' });

      await expect(courseService.createCourse(createCourseData)).rejects.toThrow('Invalid response from course creation API');
    });
  });

  describe('updateCourse', () => {
    const updateData: UpdateCourseRequest = {
      name: 'Updated Course Name',
      description: 'Updated description',
    };

    it('should update a course successfully', async () => {
      const updatedCourse = { ...mockCourse, ...updateData };
      mockApiClient.put.mockResolvedValue(updatedCourse);

      const result = await courseService.updateCourse('test-course-1', updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/api/v1/courses/test-course-1', updateData);
      expect(result).toEqual(updatedCourse);
    });

    it('should validate course ID parameter', async () => {
      await expect(courseService.updateCourse('', updateData)).rejects.toThrow('Course ID is required and must be a string');
    });

    it('should validate update data', async () => {
      await expect(courseService.updateCourse('test-course-1', {})).rejects.toThrow('At least one field must be provided for update');
    });

    it('should handle 404 errors', async () => {
      const error = { status: 404 };
      mockApiClient.put.mockRejectedValue(error);

      await expect(courseService.updateCourse('nonexistent', updateData)).rejects.toThrow('Course with ID nonexistent not found');
    });

    it('should handle 403 errors', async () => {
      const error = { status: 403 };
      mockApiClient.put.mockRejectedValue(error);

      await expect(courseService.updateCourse('test-course-1', updateData)).rejects.toThrow('You do not have permission to update this course');
    });

    it('should handle 409 conflict errors', async () => {
      const error = { status: 409 };
      mockApiClient.put.mockRejectedValue(error);

      await expect(courseService.updateCourse('test-course-1', updateData)).rejects.toThrow('A course with this name already exists');
    });
  });

  describe('deleteCourse', () => {
    it('should delete a course successfully', async () => {
      mockApiClient.delete.mockResolvedValue(undefined);

      await courseService.deleteCourse('test-course-1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/api/v1/courses/test-course-1');
    });

    it('should validate course ID parameter', async () => {
      await expect(courseService.deleteCourse('')).rejects.toThrow('Course ID is required and must be a string');
    });

    it('should handle 404 errors', async () => {
      const error = { status: 404 };
      mockApiClient.delete.mockRejectedValue(error);

      await expect(courseService.deleteCourse('nonexistent')).rejects.toThrow('Course with ID nonexistent not found');
    });

    it('should handle 403 errors', async () => {
      const error = { status: 403 };
      mockApiClient.delete.mockRejectedValue(error);

      await expect(courseService.deleteCourse('test-course-1')).rejects.toThrow('You do not have permission to delete this course');
    });

    it('should handle 409 conflict errors', async () => {
      const error = { status: 409 };
      mockApiClient.delete.mockRejectedValue(error);

      await expect(courseService.deleteCourse('test-course-1')).rejects.toThrow('Cannot delete course because it has associated content');
    });
  });

  describe('getCoursePackage', () => {
    const mockPackage = {
      course: mockCourse,
      levels: [],
      sections: [],
      modules: [],
      lessons: [],
      exercises: [],
    };

    it('should fetch course package successfully', async () => {
      mockApiClient.get.mockResolvedValue(mockPackage);

      const result = await courseService.getCoursePackage('test-course-1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/courses/test-course-1/package');
      expect(result).toEqual(mockPackage);
    });

    it('should validate course ID parameter', async () => {
      await expect(courseService.getCoursePackage('')).rejects.toThrow('Course ID is required and must be a string');
    });

    it('should handle 404 errors', async () => {
      const error = { status: 404 };
      mockApiClient.get.mockRejectedValue(error);

      await expect(courseService.getCoursePackage('nonexistent')).rejects.toThrow('Course package for ID nonexistent not found');
    });

    it('should handle 403 errors', async () => {
      const error = { status: 403 };
      mockApiClient.get.mockRejectedValue(error);

      await expect(courseService.getCoursePackage('test-course-1')).rejects.toThrow('You do not have permission to access this course package');
    });

    it('should handle 422 errors', async () => {
      const error = { status: 422 };
      mockApiClient.get.mockRejectedValue(error);

      await expect(courseService.getCoursePackage('test-course-1')).rejects.toThrow('Course package is not ready yet. Please try again later.');
    });

    it('should handle null response', async () => {
      mockApiClient.get.mockResolvedValue(null);

      await expect(courseService.getCoursePackage('test-course-1')).rejects.toThrow('Invalid course package data received from API');
    });
  });
});