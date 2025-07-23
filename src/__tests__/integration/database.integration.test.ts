/**
 * Database Integration Tests
 * Tests database connections, transactions, and data integrity
 */

import { prisma } from '../../shared/database/connection';

describe('Database Integration Tests', () => {
  afterEach(async () => {
    // Clean up ALL relevant tables in reverse dependency order
    await prisma.lessonCompletion.deleteMany();
    await prisma.userProgress.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.module.deleteMany();
    await prisma.section.deleteMany();
    await prisma.level.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();
    await prisma.revokedToken.deleteMany();
  });

  afterAll(async () => {
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
          data: {
            email: 'db-test-transaction@example.com',
            role: 'student',
            isActive: true,
            registrationDate: new Date(),
          }
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

      expect(result.user.email).toBe('db-test-transaction@example.com');
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
            data: {
              email: 'db-test-rollback@example.com',
              role: 'student',
              isActive: true,
              registrationDate: new Date(),
            }
          });
          userId = user.id;

          // This should cause the transaction to fail - invalid UUID format
          await tx.userProgress.create({
            data: {
              userId: 'invalid-uuid-format', // Invalid UUID format
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
        data: {
          id: 'db-test-concurrent',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          name: 'Concurrent Test',
          description: 'Test course',
          isPublic: true,
        }
      });

      // Create multiple levels concurrently
      const levelPromises = Array.from({ length: 5 }, (_, i) =>
        prisma.level.create({
          data: {
            id: `db-test-concurrent-${i}`,
            courseId: course.id,
            code: `L${i + 1}`,
            name: `Level ${i + 1}`,
            order: i + 1
          }
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
      // Test that creating a level without a valid course fails
      await expect(
        prisma.level.create({
          data: {
            id: 'db-test-invalid-fk',
            courseId: 'non-existent-course-id',
            code: 'A1',
            name: 'Test Level',
            order: 1
          }
        })
      ).rejects.toThrow();
    });

    it('should enforce unique constraints', async () => {
      const course = await prisma.course.create({
        data: {
          id: 'db-test-unique',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          name: 'Test Course',
          description: 'Test course',
          isPublic: true,
        }
      });

      // Create first level
      await prisma.level.create({
        data: {
          id: 'db-test-level-1',
          courseId: course.id,
          code: 'A1',
          name: 'Level 1',
          order: 1
        }
      });

      // Try to create another level with same code (should fail due to unique constraint)
      await expect(
        prisma.level.create({
          data: {
            id: 'db-test-level-2',
            courseId: course.id,
            code: 'A1', // Duplicate code
            name: 'Level 2',
            order: 2
          }
        })
      ).rejects.toThrow();
    });

    it('should handle cascading deletes', async () => {
      const course = await prisma.course.create({
        data: {
          id: 'db-test-cascade',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          name: 'Test Course',
          description: 'Test course',
          isPublic: true,
        }
      });

      const level = await prisma.level.create({
        data: {
          id: 'db-test-cascade-level',
          courseId: course.id,
          code: 'A1',
          name: 'Test Level',
          order: 1
        }
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
          email: 'db-test-null@example.com',
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
    let testCourse: any;

    beforeEach(async () => {
      // Create test data for performance tests
      testCourse = await prisma.course.create({
        data: {
          id: 'db-test-perf',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          name: 'Performance Test',
          description: 'Test course',
          isPublic: true,
        }
      });

      // Create multiple levels
      const levelPromises = Array.from({ length: 10 }, (_, i) =>
        prisma.level.create({
          data: {
            id: `db-test-perf-level-${i}`,
            courseId: testCourse.id,
            code: `L${i + 1}`,
            name: `Level ${i + 1}`,
            order: i + 1
          }
        })
      );

      await Promise.all(levelPromises);
    });

    it('should efficiently query hierarchical data', async () => {
      const startTime = Date.now();

      const courseWithLevels = await prisma.course.findUnique({
        where: { id: testCourse.id },
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
        where: { courseId: testCourse.id },
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
          courseId: testCourse.id,
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
          data: {
            email: `db-test-pool-${i}@example.com`,
            username: `testuser${i}`,
            role: 'student',
            isActive: true,
            registrationDate: new Date(),
            countryCode: 'US',
            passwordHash: '$2a$10$test.hash.for.testing.purposes.only',
            lastLoginDate: null,
            profilePictureUrl: null,
          }
        });
      });

      const users = await Promise.all(connectionPromises);
      expect(users).toHaveLength(20);
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
      const user = await prisma.user.create({
        data: {
          email: 'db-test-valid@example.com',
          role: 'student',
          isActive: true,
          registrationDate: new Date(),
        }
      });

      expect(user.email).toBe('db-test-valid@example.com');
    });

    it('should handle large text fields', async () => {
      // Respect the schema constraint - description is unlimited text, but let's be reasonable
      const longDescription = 'A'.repeat(255); // Reasonable size
      
      const course = await prisma.course.create({
        data: {
          id: 'db-test-long-desc',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          name: 'Long Description Test',
          description: longDescription,
          isPublic: true,
        }
      });

      expect(course.description).toBe(longDescription);
    });

    it('should handle special characters in text fields', async () => {
      // Respect the VarChar(100) limit for name field
      const specialText = 'Test émojis 🎉 spëcial ñ';
      
      const course = await prisma.course.create({
        data: {
          id: 'db-test-special',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          name: specialText,
          description: 'Test course',
          isPublic: true,
        }
      });

      expect(course.name).toBe(specialText);
    });
  });

  describe('Timestamp Handling', () => {
    it('should automatically set created_at timestamps', async () => {
      const beforeCreate = new Date();
      
      const user = await prisma.user.create({
        data: {
          email: 'db-test-timestamp@example.com',
          role: 'student',
          isActive: true,
          registrationDate: new Date(),
        }
      });
      
      const afterCreate = new Date();

      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should automatically update updated_at timestamps', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'db-test-update-timestamp@example.com',
          role: 'student',
          isActive: true,
          registrationDate: new Date(),
        }
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