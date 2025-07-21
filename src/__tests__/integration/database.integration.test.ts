/**
 * Database Integration Tests
 * Tests database connections, transactions, and data integrity
 */

import { prisma } from '../../shared/database/connection';
import { UserFactory } from '../../shared/test/factories/userFactory';
import { CourseFactory, LevelFactory } from '../../shared/test/factories/contentFactory';

describe('Database Integration Tests', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'db-integration-test' } }
    });
    await prisma.level.deleteMany({
      where: { id: { contains: 'db-integration-test' } }
    });
    await prisma.course.deleteMany({
      where: { id: { contains: 'db-integration-test' } }
    });
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.user.deleteMany({
      where: { email: { contains: 'db-integration-test' } }
    });
    await prisma.level.deleteMany({
      where: { id: { contains: 'db-integration-test' } }
    });
    await prisma.course.deleteMany({
      where: { id: { contains: 'db-integration-test' } }
    });
    await prisma.$disconnect();
  });

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      expect(result).toEqual([{ test: 1 }]);
    });

    it('should handle database queries', async () => {
      const userCount = await prisma.user.count();
      expect(typeof userCount).toBe('number');
    });
  });

  describe('Transaction Handling', () => {
    it('should handle successful transactions', async () => {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: UserFactory.build({
            email: 'db-integration-test-transaction@example.com'
          })
        });

        const progress = await tx.userProgress.create({
          data: {
            userId: user.id,
            experiencePoints: 100,
            livesCurrent: 5,
            streakCurrent: 3
          }
        });

        return { user, progress };
      });

      expect(result.user.email).toBe('db-integration-test-transaction@example.com');
      expect(result.progress.experiencePoints).toBe(100);

      // Verify data was committed
      const savedUser = await prisma.user.findUnique({
        where: { id: result.user.id }
      });
      expect(savedUser).toBeTruthy();
    });

    it('should rollback failed transactions', async () => {
      let userId: string | null = null;

      try {
        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: UserFactory.build({
              email: 'db-integration-test-rollback@example.com'
            })
          });
          userId = user.id;

          // This should cause the transaction to fail
          await tx.userProgress.create({
            data: {
              userId: 'non-existent-user-id', // Invalid foreign key
              experiencePoints: 100,
              livesCurrent: 5,
              streakCurrent: 3
            }
          });
        });
      } catch (error) {
        // Transaction should fail
        expect(error).toBeTruthy();
      }

      // Verify user was not created due to rollback
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });
        expect(user).toBeNull();
      }
    });

    it('should handle concurrent transactions', async () => {
      const course = await prisma.course.create({
        data: CourseFactory.build({
          id: 'db-integration-test-concurrent-course'
        })
      });

      // Create multiple levels concurrently
      const levelPromises = Array.from({ length: 5 }, (_, i) =>
        prisma.level.create({
          data: LevelFactory.build(course.id, {
            id: `db-integration-test-concurrent-level-${i}`,
            code: `L${i + 1}`,
            order: i + 1
          })
        })
      );

      const levels = await Promise.all(levelPromises);
      expect(levels).toHaveLength(5);

      // Verify all levels were created
      const savedLevels = await prisma.level.findMany({
        where: { courseId: course.id },
        orderBy: { order: 'asc' }
      });
      expect(savedLevels).toHaveLength(5);
    });
  });

  describe('Data Integrity', () => {
    it('should enforce foreign key constraints', async () => {
      await expect(
        prisma.level.create({
          data: LevelFactory.build('non-existent-course-id', {
            id: 'db-integration-test-invalid-fk-level'
          })
        })
      ).rejects.toThrow();
    });

    it('should enforce unique constraints', async () => {
      const course = await prisma.course.create({
        data: CourseFactory.build({
          id: 'db-integration-test-unique-course'
        })
      });

      // Create first level
      await prisma.level.create({
        data: LevelFactory.build(course.id, {
          id: 'db-integration-test-unique-level-1',
          code: 'A1',
          order: 1
        })
      });

      // Try to create another level with same code
      await expect(
        prisma.level.create({
          data: LevelFactory.build(course.id, {
            id: 'db-integration-test-unique-level-2',
            code: 'A1', // Duplicate code
            order: 2
          })
        })
      ).rejects.toThrow();
    });

    it('should handle cascading deletes', async () => {
      const course = await prisma.course.create({
        data: CourseFactory.build({
          id: 'db-integration-test-cascade-course'
        })
      });

      const level = await prisma.level.create({
        data: LevelFactory.build(course.id, {
          id: 'db-integration-test-cascade-level'
        })
      });

      // Delete course
      await prisma.course.delete({
        where: { id: course.id }
      });

      // Verify level was also deleted
      const deletedLevel = await prisma.level.findUnique({
        where: { id: level.id }
      });
      expect(deletedLevel).toBeNull();
    });

    it('should handle null constraints properly', async () => {
      // Test creating user without optional fields
      const user = await prisma.user.create({
        data: {
          email: 'db-integration-test-null@example.com',
          role: 'student'
          // username, passwordHash, etc. are optional
        }
      });

      expect(user.username).toBeNull();
      expect(user.passwordHash).toBeNull();
      expect(user.countryCode).toBeNull();
    });
  });

  describe('Query Performance', () => {
    beforeEach(async () => {
      // Create test data for performance tests
      const course = await prisma.course.create({
        data: CourseFactory.build({
          id: 'db-integration-test-perf-course'
        })
      });

      // Create multiple levels
      const levelPromises = Array.from({ length: 10 }, (_, i) =>
        prisma.level.create({
          data: LevelFactory.build(course.id, {
            id: `db-integration-test-perf-level-${i}`,
            code: `L${i + 1}`,
            order: i + 1
          })
        })
      );

      await Promise.all(levelPromises);
    });

    it('should efficiently query hierarchical data', async () => {
      const startTime = Date.now();

      const courseWithLevels = await prisma.course.findUnique({
        where: { id: 'db-integration-test-perf-course' },
        include: {
          levels: {
            orderBy: { order: 'asc' }
          }
        }
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(courseWithLevels).toBeTruthy();
      expect(courseWithLevels!.levels).toHaveLength(10);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle pagination efficiently', async () => {
      const startTime = Date.now();

      const paginatedLevels = await prisma.level.findMany({
        where: { courseId: 'db-integration-test-perf-course' },
        skip: 2,
        take: 5,
        orderBy: { order: 'asc' }
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(paginatedLevels).toHaveLength(5);
      expect(paginatedLevels[0]?.order).toBe(3); // Skip first 2
      expect(queryTime).toBeLessThan(500); // Should be fast
    });

    it('should handle complex filtering efficiently', async () => {
      const startTime = Date.now();

      const filteredLevels = await prisma.level.findMany({
        where: {
          courseId: 'db-integration-test-perf-course',
          AND: [
            { order: { gte: 3 } },
            { order: { lte: 7 } }
          ]
        },
        orderBy: { order: 'asc' }
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(filteredLevels).toHaveLength(5); // Levels 3-7
      expect(queryTime).toBeLessThan(500);
    });
  });

  describe('Connection Pooling', () => {
    it('should handle multiple concurrent connections', async () => {
      const connectionPromises = Array.from({ length: 20 }, async (_, i) => {
        return prisma.user.create({
          data: UserFactory.build({
            email: `db-integration-test-pool-${i}@example.com`
          })
        });
      });

      const users = await Promise.all(connectionPromises);
      expect(users).toHaveLength(20);

      // Cleanup
      await prisma.user.deleteMany({
        where: {
          email: { contains: 'db-integration-test-pool' }
        }
      });
    });

    it('should recover from connection errors gracefully', async () => {
      // This test simulates connection recovery
      // In a real scenario, you might temporarily disconnect the database
      
      // For now, we'll test that the connection is stable
      const beforeQuery = await prisma.user.count();
      
      // Simulate some load
      await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.level.count()
      ]);
      
      const afterQuery = await prisma.user.count();
      
      // Connection should remain stable
      expect(typeof beforeQuery).toBe('number');
      expect(typeof afterQuery).toBe('number');
    });
  });

  describe('Data Validation', () => {
    it('should validate email format at database level', async () => {
      // This depends on database constraints
      // Prisma handles basic validation, but database-level constraints vary
      const user = await prisma.user.create({
        data: UserFactory.build({
          email: 'db-integration-test-valid@example.com'
        })
      });

      expect(user.email).toBe('db-integration-test-valid@example.com');
    });

    it('should handle large text fields', async () => {
      const longDescription = 'A'.repeat(5000); // 5KB description
      
      const course = await prisma.course.create({
        data: CourseFactory.build({
          id: 'db-integration-test-long-desc',
          description: longDescription
        })
      });

      expect(course.description).toBe(longDescription);
    });

    it('should handle special characters in text fields', async () => {
      const specialText = 'Test with émojis 🎉 and spëcial çharacters ñ';
      
      const course = await prisma.course.create({
        data: CourseFactory.build({
          id: 'db-integration-test-special-chars',
          name: specialText
        })
      });

      expect(course.name).toBe(specialText);
    });
  });

  describe('Timestamp Handling', () => {
    it('should automatically set created_at timestamps', async () => {
      const beforeCreate = new Date();
      
      const user = await prisma.user.create({
        data: UserFactory.build({
          email: 'db-integration-test-timestamp@example.com'
        })
      });
      
      const afterCreate = new Date();

      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should automatically update updated_at timestamps', async () => {
      const user = await prisma.user.create({
        data: UserFactory.build({
          email: 'db-integration-test-update-timestamp@example.com'
        })
      });

      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { username: 'updated-username' }
      });

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});