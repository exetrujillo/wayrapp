/**
 * Progress Test Fixtures
 * Standard progress objects for different scenarios
 */

import { UserProgress, LessonCompletion, Follow, RevokedToken } from "@prisma/client";

/**
 * User Progress fixtures for different scenarios
 */
export const userProgressFixtures = {
  /**
   * New user with default progress
   */
  newUser: {
    userId: 'student-123',
    experiencePoints: 0,
    livesCurrent: 5,
    streakCurrent: 0,
    lastCompletedLessonId: null,
    lastActivityDate: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as UserProgress,

  /**
   * Active user with moderate progress
   */
  activeUser: {
    userId: 'student-123',
    experiencePoints: 250,
    livesCurrent: 4,
    streakCurrent: 7,
    lastCompletedLessonId: 'basic-greetings-lesson',
    lastActivityDate: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
  } as UserProgress,

  /**
   * Advanced user with high progress
   */
  advancedUser: {
    userId: 'student-456',
    experiencePoints: 1500,
    livesCurrent: 5,
    streakCurrent: 30,
    lastCompletedLessonId: 'advanced-lesson',
    lastActivityDate: new Date('2024-01-20T14:45:00Z'),
    updatedAt: new Date('2024-01-20T14:45:00Z'),
  } as UserProgress,

  /**
   * User with no lives remaining
   */
  noLivesUser: {
    userId: 'student-789',
    experiencePoints: 100,
    livesCurrent: 0,
    streakCurrent: 3,
    lastCompletedLessonId: 'basic-greetings-lesson',
    lastActivityDate: new Date('2024-01-10T08:00:00Z'),
    updatedAt: new Date('2024-01-10T08:00:00Z'),
  } as UserProgress,

  /**
   * User with broken streak (inactive)
   */
  brokenStreakUser: {
    userId: 'student-101',
    experiencePoints: 500,
    livesCurrent: 5,
    streakCurrent: 0,
    lastCompletedLessonId: 'family-members-lesson',
    lastActivityDate: new Date('2024-01-05T12:00:00Z'),
    updatedAt: new Date('2024-01-05T12:00:00Z'),
  } as UserProgress,

  /**
   * User with maximum streak
   */
  maxStreakUser: {
    userId: 'student-202',
    experiencePoints: 3000,
    livesCurrent: 5,
    streakCurrent: 100,
    lastCompletedLessonId: 'advanced-lesson',
    lastActivityDate: new Date('2024-01-20T16:00:00Z'),
    updatedAt: new Date('2024-01-20T16:00:00Z'),
  } as UserProgress,

  /**
   * User with recent activity (today)
   */
  recentActivityUser: {
    userId: 'student-303',
    experiencePoints: 75,
    livesCurrent: 3,
    streakCurrent: 2,
    lastCompletedLessonId: 'basic-greetings-lesson',
    lastActivityDate: new Date(),
    updatedAt: new Date(),
  } as UserProgress,
};

/**
 * Lesson Completion fixtures for different scenarios
 */
export const lessonCompletionFixtures = {
  /**
   * Perfect score completion
   */
  perfectScore: {
    userId: 'student-123',
    lessonId: 'basic-greetings-lesson',
    completedAt: new Date('2024-01-15T10:30:00Z'),
    score: 100,
    timeSpentSeconds: 300, // 5 minutes
  } as LessonCompletion,

  /**
   * Good score completion
   */
  goodScore: {
    userId: 'student-123',
    lessonId: 'formal-greetings-lesson',
    completedAt: new Date('2024-01-16T11:00:00Z'),
    score: 85,
    timeSpentSeconds: 420, // 7 minutes
  } as LessonCompletion,

  /**
   * Average score completion
   */
  averageScore: {
    userId: 'student-456',
    lessonId: 'family-members-lesson',
    completedAt: new Date('2024-01-17T14:15:00Z'),
    score: 70,
    timeSpentSeconds: 600, // 10 minutes
  } as LessonCompletion,

  /**
   * Low score completion
   */
  lowScore: {
    userId: 'student-789',
    lessonId: 'basic-greetings-lesson',
    completedAt: new Date('2024-01-18T09:45:00Z'),
    score: 45,
    timeSpentSeconds: 900, // 15 minutes
  } as LessonCompletion,

  /**
   * Completion without score (informative lesson)
   */
  noScore: {
    userId: 'student-101',
    lessonId: 'basic-greetings-lesson',
    completedAt: new Date('2024-01-19T13:20:00Z'),
    score: null,
    timeSpentSeconds: 180, // 3 minutes
  } as LessonCompletion,

  /**
   * Completion without time tracking
   */
  noTimeTracking: {
    userId: 'student-202',
    lessonId: 'formal-greetings-lesson',
    completedAt: new Date('2024-01-20T15:30:00Z'),
    score: 90,
    timeSpentSeconds: null,
  } as LessonCompletion,

  /**
   * Quick completion (very fast)
   */
  quickCompletion: {
    userId: 'student-303',
    lessonId: 'basic-greetings-lesson',
    completedAt: new Date('2024-01-21T08:10:00Z'),
    score: 95,
    timeSpentSeconds: 120, // 2 minutes
  } as LessonCompletion,

  /**
   * Slow completion (took a long time)
   */
  slowCompletion: {
    userId: 'student-404',
    lessonId: 'advanced-lesson',
    completedAt: new Date('2024-01-22T16:45:00Z'),
    score: 80,
    timeSpentSeconds: 1800, // 30 minutes
  } as LessonCompletion,
};

/**
 * Follow relationship fixtures for social features
 */
export const followFixtures = {
  /**
   * Student following another student
   */
  studentFollowsStudent: {
    followerId: 'student-123',
    followedId: 'student-456',
    createdAt: new Date('2024-01-10T12:00:00Z'),
  } as Follow,

  /**
   * Student following content creator
   */
  studentFollowsCreator: {
    followerId: 'student-123',
    followedId: 'creator-123',
    createdAt: new Date('2024-01-12T14:30:00Z'),
  } as Follow,

  /**
   * Recent follow relationship
   */
  recentFollow: {
    followerId: 'student-789',
    followedId: 'student-123',
    createdAt: new Date(),
  } as Follow,

  /**
   * Old follow relationship
   */
  oldFollow: {
    followerId: 'student-101',
    followedId: 'student-202',
    createdAt: new Date('2023-12-01T10:00:00Z'),
  } as Follow,
};

/**
 * Revoked Token fixtures for authentication testing
 */
export const revokedTokenFixtures = {
  /**
   * Recently revoked token
   */
  recentlyRevoked: {
    id: 'revoked-token-1',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdHVkZW50LTEyMyJ9.example',
    userId: 'student-123',
    revokedAt: new Date('2024-01-20T10:00:00Z'),
    expiresAt: new Date('2024-01-20T11:00:00Z'),
  } as RevokedToken,

  /**
   * Expired revoked token
   */
  expiredRevoked: {
    id: 'revoked-token-2',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdHVkZW50LTQ1NiJ9.example',
    userId: 'student-456',
    revokedAt: new Date('2024-01-15T08:00:00Z'),
    expiresAt: new Date('2024-01-15T09:00:00Z'),
  } as RevokedToken,

  /**
   * Long-lived revoked token
   */
  longLivedRevoked: {
    id: 'revoked-token-3',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi0xMjMifQ.example',
    userId: 'admin-123',
    revokedAt: new Date('2024-01-18T16:30:00Z'),
    expiresAt: new Date('2024-01-25T16:30:00Z'), // 7 days later
  } as RevokedToken,
};

/**
 * Helper functions for creating progress fixtures with variations
 */
export const progressFixtureHelpers = {
  /**
   * Create a user progress fixture with custom properties
   */
  createUserProgress: (overrides: Partial<UserProgress> = {}): UserProgress => ({
    ...userProgressFixtures.activeUser,
    ...overrides,
  }),

  /**
   * Create a lesson completion fixture with custom properties
   */
  createLessonCompletion: (overrides: Partial<LessonCompletion> = {}): LessonCompletion => ({
    ...lessonCompletionFixtures.goodScore,
    ...overrides,
  }),

  /**
   * Create a follow relationship fixture with custom properties
   */
  createFollow: (overrides: Partial<Follow> = {}): Follow => ({
    ...followFixtures.studentFollowsStudent,
    ...overrides,
  }),

  /**
   * Create a revoked token fixture with custom properties
   */
  createRevokedToken: (overrides: Partial<RevokedToken> = {}): RevokedToken => ({
    ...revokedTokenFixtures.recentlyRevoked,
    ...overrides,
  }),

  /**
   * Create progress data for different experience levels
   */
  createProgressByLevel: (level: 'beginner' | 'intermediate' | 'advanced' | 'expert'): UserProgress => {
    const baseProgress = userProgressFixtures.newUser;
    
    switch (level) {
      case 'beginner':
        return progressFixtureHelpers.createUserProgress({
          experiencePoints: Math.floor(Math.random() * 100), // 0-99
          streakCurrent: Math.floor(Math.random() * 5), // 0-4
          livesCurrent: 5,
        });
      
      case 'intermediate':
        return progressFixtureHelpers.createUserProgress({
          experiencePoints: 100 + Math.floor(Math.random() * 400), // 100-499
          streakCurrent: 5 + Math.floor(Math.random() * 10), // 5-14
          livesCurrent: 3 + Math.floor(Math.random() * 3), // 3-5
        });
      
      case 'advanced':
        return progressFixtureHelpers.createUserProgress({
          experiencePoints: 500 + Math.floor(Math.random() * 1000), // 500-1499
          streakCurrent: 15 + Math.floor(Math.random() * 20), // 15-34
          livesCurrent: 4 + Math.floor(Math.random() * 2), // 4-5
        });
      
      case 'expert':
        return progressFixtureHelpers.createUserProgress({
          experiencePoints: 1500 + Math.floor(Math.random() * 2000), // 1500+
          streakCurrent: 35 + Math.floor(Math.random() * 65), // 35-99
          livesCurrent: 5,
        });
      
      default:
        return baseProgress;
    }
  },

  /**
   * Create lesson completions for a user across multiple lessons
   */
  createUserLessonCompletions: (
    userId: string, 
    lessonIds: string[], 
    options: {
      scoreRange?: [number, number];
      timeRange?: [number, number]; // in seconds
      startDate?: Date;
      daysBetween?: number;
    } = {}
  ): LessonCompletion[] => {
    const {
      scoreRange = [60, 100],
      timeRange = [180, 900], // 3-15 minutes
      startDate = new Date('2024-01-01T00:00:00Z'),
      daysBetween = 1,
    } = options;

    return lessonIds.map((lessonId, index) => {
      const completedAt = new Date(startDate);
      completedAt.setDate(completedAt.getDate() + (index * daysBetween));

      const score = Math.floor(
        Math.random() * (scoreRange[1] - scoreRange[0] + 1) + scoreRange[0]
      );
      
      const timeSpentSeconds = Math.floor(
        Math.random() * (timeRange[1] - timeRange[0] + 1) + timeRange[0]
      );

      return progressFixtureHelpers.createLessonCompletion({
        userId,
        lessonId,
        completedAt,
        score,
        timeSpentSeconds,
      });
    });
  },

  /**
   * Create follow relationships for a user (following others)
   */
  createUserFollowing: (
    followerId: string, 
    followedIds: string[], 
    startDate: Date = new Date('2024-01-01T00:00:00Z')
  ): Follow[] => {
    return followedIds.map((followedId, index) => {
      const createdAt = new Date(startDate);
      createdAt.setDate(createdAt.getDate() + index);

      return progressFixtureHelpers.createFollow({
        followerId,
        followedId,
        createdAt,
      });
    });
  },

  /**
   * Create follow relationships for a user (followers)
   */
  createUserFollowers: (
    followedId: string, 
    followerIds: string[], 
    startDate: Date = new Date('2024-01-01T00:00:00Z')
  ): Follow[] => {
    return followerIds.map((followerId, index) => {
      const createdAt = new Date(startDate);
      createdAt.setDate(createdAt.getDate() + index);

      return progressFixtureHelpers.createFollow({
        followerId,
        followedId,
        createdAt,
      });
    });
  },

  /**
   * Create revoked tokens for a user
   */
  createUserRevokedTokens: (
    userId: string, 
    count: number = 3,
    baseDate: Date = new Date('2024-01-01T00:00:00Z')
  ): RevokedToken[] => {
    return Array.from({ length: count }, (_, index) => {
      const revokedAt = new Date(baseDate);
      revokedAt.setHours(revokedAt.getHours() + index);
      
      const expiresAt = new Date(revokedAt);
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      return progressFixtureHelpers.createRevokedToken({
        id: `revoked-token-${userId}-${index + 1}`,
        token: `token-${userId}-${index + 1}-example`,
        userId,
        revokedAt,
        expiresAt,
      });
    });
  },

  /**
   * Create a complete progress scenario for a user
   */
  createCompleteUserProgress: (
    userId: string,
    scenario: 'new' | 'active' | 'advanced' | 'struggling' = 'active'
  ): {
    progress: UserProgress;
    completions: LessonCompletion[];
    following: Follow[];
    followers: Follow[];
  } => {
    let progress: UserProgress;
    let completions: LessonCompletion[];
    
    switch (scenario) {
      case 'new':
        progress = progressFixtureHelpers.createUserProgress({
          userId,
          experiencePoints: 0,
          streakCurrent: 0,
          livesCurrent: 5,
          lastCompletedLessonId: null,
        });
        completions = [];
        break;
        
      case 'active':
        progress = progressFixtureHelpers.createUserProgress({
          userId,
          experiencePoints: 250,
          streakCurrent: 7,
          livesCurrent: 4,
        });
        completions = progressFixtureHelpers.createUserLessonCompletions(
          userId,
          ['basic-greetings-lesson', 'formal-greetings-lesson', 'family-members-lesson'],
          { scoreRange: [70, 95] }
        );
        break;
        
      case 'advanced':
        progress = progressFixtureHelpers.createUserProgress({
          userId,
          experiencePoints: 1500,
          streakCurrent: 30,
          livesCurrent: 5,
        });
        completions = progressFixtureHelpers.createUserLessonCompletions(
          userId,
          ['basic-greetings-lesson', 'formal-greetings-lesson', 'family-members-lesson', 'advanced-lesson'],
          { scoreRange: [85, 100], timeRange: [120, 300] }
        );
        break;
        
      case 'struggling':
        progress = progressFixtureHelpers.createUserProgress({
          userId,
          experiencePoints: 50,
          streakCurrent: 0,
          livesCurrent: 1,
        });
        completions = progressFixtureHelpers.createUserLessonCompletions(
          userId,
          ['basic-greetings-lesson'],
          { scoreRange: [40, 65], timeRange: [600, 1200] }
        );
        break;
        
      default:
        progress = userProgressFixtures.activeUser;
        completions = [];
    }

    const following = progressFixtureHelpers.createUserFollowing(
      userId,
      ['student-456', 'creator-123']
    );
    
    const followers = progressFixtureHelpers.createUserFollowers(
      userId,
      ['student-789', 'student-101']
    );

    return { progress, completions, following, followers };
  },

  /**
   * Create progress data for leaderboard testing
   */
  createLeaderboardData: (userCount: number = 10): UserProgress[] => {
    return Array.from({ length: userCount }, (_, index) => {
      const experiencePoints = Math.floor(Math.random() * 2000) + (userCount - index) * 100;
      const streakCurrent = Math.floor(Math.random() * 50) + Math.floor(experiencePoints / 100);
      
      return progressFixtureHelpers.createUserProgress({
        userId: `leaderboard-user-${index + 1}`,
        experiencePoints,
        streakCurrent,
        livesCurrent: Math.floor(Math.random() * 6), // 0-5
        lastActivityDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
      });
    }).sort((a, b) => b.experiencePoints - a.experiencePoints); // Sort by experience points descending
  },
};