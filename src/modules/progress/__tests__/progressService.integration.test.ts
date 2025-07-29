// src/modules/progress/__tests__/progressService.integration.test.ts

import request from 'supertest';
import app from '../../../app';
import { TestFactory } from '../../../shared/test/factories/testFactory';

const prisma = TestFactory.prisma;

describe('Progress Summary Analytics Integration Tests', () => {

  beforeEach(async () => {
    await TestFactory.cleanupDatabase();
  });

  afterAll(async () => {
    await TestFactory.cleanupDatabase();
    await prisma.$disconnect();
  });

  describe('longest_streak calculation', () => {
    it('should calculate longest streak correctly with multiple separate streaks', async () => {
      const { user, authToken, module } = await TestFactory.createFullContentHierarchy();

      await prisma.userProgress.create({
        data: { userId: user.id, streakCurrent: 2 },
      });

      const lessons = [];
      for (let i = 0; i < 8; i++) {
        lessons.push(await prisma.lesson.create({ 
          data: { 
            id: `streak-lesson-${i}`, 
            name: `L${i}`, 
            order: i+1, 
            moduleId: module.id 
          }
        }));
      }

      const completionDates = [
        new Date('2024-01-01T10:00:00Z'), // Streak 1
        new Date('2024-01-02T10:00:00Z'),
        new Date('2024-01-03T10:00:00Z'),
        new Date('2024-01-05T10:00:00Z'), // Streak 2 (más larga)
        new Date('2024-01-06T10:00:00Z'),
        new Date('2024-01-07T10:00:00Z'),
        new Date('2024-01-08T10:00:00Z'),
        new Date('2024-01-09T10:00:00Z'),
      ];

      for (let i = 0; i < completionDates.length; i++) {
        await prisma.lessonCompletion.create({
          data: { 
            userId: user.id, 
            lessonId: lessons[i]!.id, 
            completedAt: completionDates[i]! 
          },
        });
      }

      // EXECUTE
      const response = await request(app)
        .get('/api/v1/progress/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // ASSERT
      expect(response.body.data.longest_streak).toBe(5);
    });

    it('should handle multiple completions on the same day correctly', async () => {
      // SETUP
      const { user, authToken, module } = await TestFactory.createFullContentHierarchy();

      await prisma.userProgress.create({
        data: { userId: user.id, streakCurrent: 1 },
      });

      const lessons = [];
      for (let i = 0; i < 3; i++) {
        lessons.push(await prisma.lesson.create({
          data: {
            id: `same-day-lesson-${i}`,
            name: `Same Day Lesson ${i}`,
            order: i + 1,
            moduleId: module.id
          }
        }));
      }

      await Promise.all([
        prisma.lessonCompletion.create({
          data: {
            userId: user.id,
            lessonId: lessons[0]!.id,
            completedAt: new Date('2024-01-01T09:00:00Z'),
            score: 90
          }
        }),
        prisma.lessonCompletion.create({
          data: {
            userId: user.id,
            lessonId: lessons[1]!.id,
            completedAt: new Date('2024-01-01T15:00:00Z'),
            score: 95
          }
        }),

        prisma.lessonCompletion.create({
          data: {
            userId: user.id,
            lessonId: lessons[2]!.id,
            completedAt: new Date('2024-01-02T10:00:00Z'),
            score: 88
          }
        })
      ]);

      // EXECUTE
      const response = await request(app)
        .get('/api/v1/progress/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // ASSERT
      expect(response.body.data.longest_streak).toBe(2);
    });

    it('should return 0 for longest_streak when no completions exist', async () => {
      // SETUP
      const { user, authToken } = await TestFactory.createFullContentHierarchy();

      await prisma.userProgress.create({
        data: { userId: user.id, streakCurrent: 0 },
      });

      // EXECUTE
      const response = await request(app)
        .get('/api/v1/progress/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // ASSERT
      expect(response.body.data.longest_streak).toBe(0);
    });
  });

  describe('completion_percentage calculation', () => {
    it('should calculate completion percentage correctly', async () => {
      // SETUP
      const { user, authToken, module } = await TestFactory.createFullContentHierarchy();
      
      for (let i = 0; i < 10; i++) {
        await prisma.lesson.create({ 
          data: { 
            id: `percentage-lesson-${i}`, 
            name: `L${i}`, 
            order: i+1, 
            moduleId: module.id 
          }
        });
      }

      const lessonsToComplete = await prisma.lesson.findMany({ take: 4 });
      for(const lesson of lessonsToComplete) {
        await prisma.lessonCompletion.create({ 
          data: { 
            userId: user.id, 
            lessonId: lesson.id, 
            completedAt: new Date() 
          }
        });
      }
      
      // EXECUTE
      const response = await request(app)
        .get('/api/v1/progress/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // ASSERT
      expect(response.body.data.completion_percentage).toBe(40.0);
    });

    it('should handle edge case of 0 total lessons (avoid division by zero)', async () => {
      // SETUP
      const { user, authToken } = await TestFactory.createFullContentHierarchy();
      
      await prisma.userProgress.create({
        data: { userId: user.id, streakCurrent: 0 },
      });

      // EXECUTE
      const response = await request(app)
        .get('/api/v1/progress/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // ASSERT
      expect(response.body.data.completion_percentage).toBe(0);
      expect(response.body.data.lessons_completed).toBe(0);
    });

    it('should calculate 100% completion correctly', async () => {
      // SETUP
      const { user, authToken, module } = await TestFactory.createFullContentHierarchy();

      // Crear 5 lecciones
      const lessons = [];
      for (let i = 1; i <= 5; i++) {
        const lesson = await prisma.lesson.create({
          data: {
            id: `complete-lesson-${i}`,
            name: `Complete Lesson ${i}`,
            order: i,
            moduleId: module.id
          }
        });
        lessons.push(lesson);
      }

      await prisma.userProgress.create({
        data: { userId: user.id, streakCurrent: 5 },
      });

      for (const lesson of lessons) {
        await prisma.lessonCompletion.create({
          data: {
            userId: user.id,
            lessonId: lesson.id,
            completedAt: new Date(),
            score: 95
          }
        });
      }

      // EXECUTE
      const response = await request(app)
        .get('/api/v1/progress/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // ASSERT
      expect(response.body.data.completion_percentage).toBe(100.0);
      expect(response.body.data.lessons_completed).toBe(5);
    });
  });

  describe('average_score calculation', () => {
    it('should calculate average score correctly with different scores', async () => {
      // SETUP
      const { user, authToken, module } = await TestFactory.createFullContentHierarchy();

      const lessons = await Promise.all([
        prisma.lesson.create({
          data: {
            id: 'score-lesson-1',
            name: 'Score Lesson 1',
            order: 1,
            moduleId: module.id
          }
        }),
        prisma.lesson.create({
          data: {
            id: 'score-lesson-2',
            name: 'Score Lesson 2',
            order: 2,
            moduleId: module.id
          }
        }),
        prisma.lesson.create({
          data: {
            id: 'score-lesson-3',
            name: 'Score Lesson 3',
            order: 3,
            moduleId: module.id
          }
        })
      ]);

      await prisma.userProgress.create({
        data: { userId: user.id, streakCurrent: 3 },
      });
      const scores = [100, 90, 80];
      for (let i = 0; i < scores.length; i++) {
        await prisma.lessonCompletion.create({
          data: {
            userId: user.id,
            lessonId: lessons[i]!.id,
            completedAt: new Date(),
            score: scores[i]!
          }
        });
      }

      // EXECUTE
      const response = await request(app)
        .get('/api/v1/progress/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // ASSERT 
      expect(response.body.data.average_score).toBe(90.0);
    });

    it('should handle edge case of no completions with scores', async () => {
      // SETUP
      const { user, authToken } = await TestFactory.createFullContentHierarchy();

      await prisma.userProgress.create({
        data: { userId: user.id, streakCurrent: 0 },
      });

      // EXECUTE
      const response = await request(app)
        .get('/api/v1/progress/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // ASSERT 
      expect(response.body.data.average_score).toBe(0);
    });

    it('should handle completions with null scores correctly', async () => {
      // SETUP
      const { user, authToken, module } = await TestFactory.createFullContentHierarchy();

      const lesson = await prisma.lesson.create({
        data: {
          id: 'null-score-lesson',
          name: 'Null Score Lesson',
          order: 1,
          moduleId: module.id
        }
      });

      await prisma.userProgress.create({
        data: { userId: user.id, streakCurrent: 1 },
      });


      await prisma.lessonCompletion.create({
        data: {
          userId: user.id,
          lessonId: lesson.id,
          completedAt: new Date(),
          score: null
        }
      });

      // EXECUTE
      const response = await request(app)
        .get('/api/v1/progress/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // ASSERT
      expect(response.body.data.average_score).toBe(0);
      expect(response.body.data.lessons_completed).toBe(1);
    });

    it('should calculate average with mixed null and valid scores', async () => {
      // SETUP
      const { user, authToken, module } = await TestFactory.createFullContentHierarchy();

      const lessons = await Promise.all([
        prisma.lesson.create({
          data: {
            id: 'mixed-lesson-1',
            name: 'Mixed Lesson 1',
            order: 1,
            moduleId: module.id
          }
        }),
        prisma.lesson.create({
          data: {
            id: 'mixed-lesson-2',
            name: 'Mixed Lesson 2',
            order: 2,
            moduleId: module.id
          }
        })
      ]);

      await prisma.userProgress.create({
        data: { userId: user.id, streakCurrent: 2 },
      });

      await Promise.all([
        prisma.lessonCompletion.create({
          data: {
            userId: user.id,
            lessonId: lessons[0]!.id,
            completedAt: new Date(),
            score: 80 // Score válido
          }
        }),
        prisma.lessonCompletion.create({
          data: {
            userId: user.id,
            lessonId: lessons[1]!.id,
            completedAt: new Date(),
            score: null // Score null
          }
        })
      ]);

      // EXECUTE
      const response = await request(app)
        .get('/api/v1/progress/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // ASSERT
      expect(response.body.data.average_score).toBe(80.0);
      expect(response.body.data.lessons_completed).toBe(2);
    });
  });

  describe('integrated analytics validation', () => {
    it('should return all analytics fields correctly in a comprehensive scenario', async () => {
      // SETUP
      const { user, authToken, module } = await TestFactory.createFullContentHierarchy();

      const totalLessons = 8;
      const lessons = [];

      for (let i = 1; i <= totalLessons; i++) {
        const lesson = await prisma.lesson.create({
          data: {
            id: `comprehensive-lesson-${i}`,
            name: `Comprehensive Lesson ${i}`,
            order: i,
            moduleId: module.id
          }
        });
        lessons.push(lesson);
      }

      await prisma.userProgress.create({
        data: {
          userId: user.id,
          experiencePoints: 400,
          livesCurrent: 3,
          streakCurrent: 2
        }
      });

      const completionData = [
        { lessonIndex: 0, date: '2024-01-01T10:00:00Z', score: 95 },
        { lessonIndex: 1, date: '2024-01-02T10:00:00Z', score: 85 },
        { lessonIndex: 2, date: '2024-01-03T10:00:00Z', score: 90 },
        { lessonIndex: 3, date: '2024-01-04T10:00:00Z', score: 80 },
        // Gap en Jan 5
        { lessonIndex: 4, date: '2024-01-06T10:00:00Z', score: 100 },
        { lessonIndex: 5, date: '2024-01-07T10:00:00Z', score: 70 }
      ];

      for (const completion of completionData) {
        await prisma.lessonCompletion.create({
          data: {
            userId: user.id,
            lessonId: lessons[completion.lessonIndex]!.id,
            completedAt: new Date(completion.date),
            score: completion.score
          }
        });
      }

      // EXECUTE
      const response = await request(app)
        .get('/api/v1/progress/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const data = response.body.data;

      // ASSERT 
      expect(data.lessons_completed).toBe(6);
      expect(data.completion_percentage).toBe(75.0); // 6/8 * 100
      expect(data.longest_streak).toBe(4); // Jan 1-4 streak
      expect(data.average_score).toBe(86.67); // (95+85+90+80+100+70)/6 = 86.67
      expect(data.user_id).toBe(user.id);
      expect(data.experience_points).toBe(400);
      expect(data.lives_current).toBe(3);
      expect(data.streak_current).toBe(2);
      expect(data.courses_started).toBeGreaterThanOrEqual(0);
      expect(data.courses_completed).toBeGreaterThanOrEqual(0);
      expect(data.last_activity_date).toBeDefined();
    });
  });
});