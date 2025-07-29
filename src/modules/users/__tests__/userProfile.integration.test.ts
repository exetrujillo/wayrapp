/**
 * User Profile Integration Tests
 * Tests for profile update whitelist pattern and security hardening
 */

import request from "supertest";
import app from "../../../app";
import { prisma } from "../../../shared/database/connection";
import { UserFactory } from "../../../shared/test/factories/userFactory";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

describe("User Profile Integration Tests - Whitelist Pattern", () => {
  const API_BASE = "/api/v1";
  let testUser: any;
  let authToken: string;
  const testPassword = "SecurePass123!";

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        ...UserFactory.build({
          email: "profile-test@example.com",
          passwordHash: await bcrypt.hash(testPassword, 10),
          username: "testuser",
          countryCode: "US",
          profilePictureUrl: "https://example.com/old-avatar.jpg",
          role: "student"
        }),
      },
    });

    // Generate auth token
    authToken = jwt.sign(
      {
        sub: testUser.id,
        email: testUser.email,
        role: testUser.role,
      },
      process.env['JWT_SECRET'] || "test-secret",
      { expiresIn: "1h" }
    );
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("PUT /users/profile - Whitelist Pattern Security", () => {
    it("should only allow permitted fields to be updated", async () => {
      const updateData = {
        username: "newusername",
        country_code: "CA",
        profile_picture_url: "https://example.com/new-avatar.jpg"
      };

      const response = await request(app)
        .put(`${API_BASE}/users/profile`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        username: "newusername",
        country_code: "CA",
        profile_picture_url: "https://example.com/new-avatar.jpg"
      });

      // Verify database was updated correctly (Prisma returns camelCase)
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });

      expect(updatedUser).toMatchObject({
        username: "newusername",
        countryCode: "CA",
        profilePictureUrl: "https://example.com/new-avatar.jpg",
        role: "student", // Should remain unchanged
        isActive: true  // Should remain unchanged
      });
    });

    it("should handle partial updates with only some allowed fields", async () => {
      const updateData = {
        username: "partialusername"
        // Only updating username, not other fields
      };

      const response = await request(app)
        .put(`${API_BASE}/users/profile`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe("partialusername");

      // Verify other fields remained unchanged (Prisma returns camelCase)
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });

      expect(updatedUser).toMatchObject({
        username: "partialusername",
        countryCode: "US", // Should remain unchanged
        profilePictureUrl: "https://example.com/old-avatar.jpg", // Should remain unchanged
        role: "student", // Should remain unchanged
        isActive: true  // Should remain unchanged
      });
    });

    it("should strip unauthorized fields (Zod validation behavior)", async () => {
      const updateData = {
        username: "newusername",
        role: "admin", // This field should be stripped by Zod validation
        is_active: false // This field should be stripped by Zod validation
      };

      // Zod strips unknown fields, so this should succeed with only username being updated
      const response = await request(app)
        .put(`${API_BASE}/users/profile`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe("newusername");
      
      // Verify only allowed fields were updated (Prisma returns camelCase)
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });

      expect(updatedUser).toMatchObject({
        username: "newusername", // Should be updated
        role: "student", // Should remain unchanged (unauthorized field was stripped)
        isActive: true  // Should remain unchanged (unauthorized field was stripped)
      });
    });

    it("should require authentication", async () => {
      const updateData = {
        username: "newusername"
      };

      const response = await request(app)
        .put(`${API_BASE}/users/profile`)
        .send(updateData)
        .expect(401);

      expect(response.body.error.code).toBe("AUTHENTICATION_ERROR");
    });

    it("should validate field formats correctly", async () => {
      const updateData = {
        username: "ab", // Too short (minimum 3 characters)
        country_code: "USA", // Too long (must be 2 characters)
        profile_picture_url: "not-a-valid-url" // Invalid URL format
      };

      const response = await request(app)
        .put(`${API_BASE}/users/profile`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "username",
            message: expect.stringContaining("at least 3 characters")
          }),
          expect.objectContaining({
            field: "country_code",
            message: expect.stringContaining("2 characters")
          }),
          expect.objectContaining({
            field: "profile_picture_url",
            message: expect.stringContaining("Invalid URL format")
          })
        ])
      );
    });

    it("should handle empty update requests", async () => {
      const updateData = {};

      const response = await request(app)
        .put(`${API_BASE}/users/profile`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify user data remained unchanged (Prisma returns camelCase)
      const unchangedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });

      expect(unchangedUser).toMatchObject({
        username: "testuser",
        countryCode: "US",
        profilePictureUrl: "https://example.com/old-avatar.jpg",
        role: "student",
        isActive: true
      });
    });
  });
});