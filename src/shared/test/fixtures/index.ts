/**
 * Test Fixtures Index
 * Central export point for all test fixtures
 */

// User fixtures
export * from "./userFixtures";

// Content fixtures
export * from "./contentFixtures";

// Progress fixtures
export * from "./progressFixtures";

/**
 * All fixtures grouped by category for easy access
 */
export const fixtures = {
  // Re-export user fixtures
  users: require("./userFixtures"),

  // Re-export content fixtures
  content: require("./contentFixtures"),

  // Re-export progress fixtures
  progress: require("./progressFixtures"),
};

/**
 * Common fixture combinations for complex testing scenarios
 */
export const fixtureScenarios = {
  /**
   * Complete user scenario with progress and content
   */
  completeUserScenario: (userId: string = "test-user-123") => {
    const { userFixtureHelpers } = require("./userFixtures");
    const { progressFixtureHelpers } = require("./progressFixtures");
    const { contentFixtureHelpers } = require("./contentFixtures");

    const user = userFixtureHelpers.createUser({ id: userId });
    const progressData = progressFixtureHelpers.createCompleteUserProgress(
      userId,
      "active",
    );
    const courseStructure =
      contentFixtureHelpers.createCompleteCourseStructure("test-course");

    return {
      user,
      ...progressData,
      ...courseStructure,
    };
  },

  /**
   * Multi-user learning scenario
   */
  multiUserLearningScenario: () => {
    const { userFixtureHelpers } = require("./userFixtures");
    const { progressFixtureHelpers } = require("./progressFixtures");
    const { contentFixtureHelpers } = require("./contentFixtures");

    const users = userFixtureHelpers.createUsersWithRoles(3);
    const courseStructure =
      contentFixtureHelpers.createCompleteCourseStructure("multi-user-course");
    const leaderboardData = progressFixtureHelpers.createLeaderboardData(5);

    return {
      users,
      ...courseStructure,
      leaderboard: leaderboardData,
    };
  },

  /**
   * Course completion scenario
   */
  courseCompletionScenario: (userId: string = "completing-user") => {
    const { userFixtureHelpers } = require("./userFixtures");
    const { progressFixtureHelpers } = require("./progressFixtures");
    const { contentFixtureHelpers } = require("./contentFixtures");

    const user = userFixtureHelpers.createUser({ id: userId });
    const courseStructure =
      contentFixtureHelpers.createCompleteCourseStructure("completion-course");

    // Create completions for all lessons in the course
    const completions = progressFixtureHelpers.createUserLessonCompletions(
      userId,
      courseStructure.lessons.map((lesson: { id: any }) => lesson.id),
      { scoreRange: [80, 100] },
    );

    const progress = progressFixtureHelpers.createUserProgress({
      userId,
      experiencePoints: completions.length * 15, // Average 15 XP per lesson
      streakCurrent: completions.length,
      lastCompletedLessonId:
        courseStructure.lessons[courseStructure.lessons.length - 1].id,
    });

    return {
      user,
      progress,
      completions,
      ...courseStructure,
    };
  },
};
