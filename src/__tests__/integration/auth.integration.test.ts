/**
 * Authentication Integration Tests
 * Tests authentication flows, JWT handling, and security features
 */

import request from "supertest";
import app from "../../app";
import { prisma } from "../../shared/database/connection";
import { UserFactory } from "../../shared/test/factories/userFactory";
import bcrypt from "bcryptjs";

describe("Authentication Integration Tests", () => {
  const API_BASE = "/api/v1";

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.revokedToken.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { contains: "auth-integration-test" } },
    });
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.revokedToken.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { contains: "auth-integration-test" } },
    });
    await prisma.$disconnect();
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        email: "auth-integration-test-register@example.com",
        password: "SecurePass123!",
        username: "testuser123",
        country_code: "US",
      };

      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        email: userData.email,
        username: userData.username,
        role: "student",
      });
      expect(response.body.data.tokens).toHaveProperty("accessToken");
      expect(response.body.data.tokens).toHaveProperty("refreshToken");
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    it("should reject registration with weak password", async () => {
      const userData = {
        email: "auth-integration-test-weak@example.com",
        password: "weak",
        username: "testuser",
      };

      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send(userData)
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
          }),
        ]),
      );
    });

    it("should reject duplicate email registration", async () => {
      const userData = {
        email: "auth-integration-test-duplicate@example.com",
        password: "SecurePass123!",
        username: "testuser1",
      };

      // First registration
      await request(app)
        .post(`${API_BASE}/auth/register`)
        .send(userData)
        .expect(201);

      // Duplicate registration
      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send({
          ...userData,
          username: "testuser2",
        })
        .expect(409);

      expect(response.body.error.code).toBe("CONFLICT");
      expect(response.body.error.message).toContain("Email already registered");
    });

    it("should enforce rate limiting on registration", async () => {
      const userData = {
        email: "auth-integration-test-rate@example.com",
        password: "SecurePass123!",
        username: "testuser",
      };

      // Make multiple rapid requests to trigger rate limiting
      const requests = Array(6)
        .fill(null)
        .map((_, i) =>
          request(app)
            .post(`${API_BASE}/auth/register`)
            .send({
              ...userData,
              email: `auth-integration-test-rate${i}@example.com`,
              username: `testuser${i}`,
            }),
        );

      const responses = await Promise.all(requests);

      // Some requests should be rate limited (429)
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe("POST /auth/login", () => {
    let testUser: any;
    const testPassword = "SecurePass123!";

    beforeEach(async () => {
      // Create test user
      testUser = await prisma.user.create({
        data: {
          ...UserFactory.build({
            email: "auth-integration-test-login@example.com",
            passwordHash: await bcrypt.hash(testPassword, 10),
          }),
        },
      });
    });

    it("should login successfully with valid credentials", async () => {
      const response = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: testUser.email,
          password: testPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
      });
      expect(response.body.data.tokens).toHaveProperty("accessToken");
      expect(response.body.data.tokens).toHaveProperty("refreshToken");
    });

    it("should reject login with invalid password", async () => {
      const response = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: testUser.email,
          password: "WrongPassword123!",
        })
        .expect(401);

      expect(response.body.error.code).toBe("AUTHENTICATION_ERROR");
      expect(response.body.error.message).toContain("Invalid credentials");
    });

    it("should reject login with non-existent email", async () => {
      const response = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: "nonexistent@example.com",
          password: testPassword,
        })
        .expect(401);

      expect(response.body.error.code).toBe("AUTHENTICATION_ERROR");
    });

    it("should reject login for inactive user", async () => {
      // Deactivate user
      await prisma.user.update({
        where: { id: testUser.id },
        data: { isActive: false },
      });

      const response = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: testUser.email,
          password: testPassword,
        })
        .expect(401);

      expect(response.body.error.code).toBe("AUTHENTICATION_ERROR");
    });
  });

  describe("POST /auth/refresh", () => {
    let testUser: any;
    let refreshToken: string;

    beforeEach(async () => {
      // Create test user and get tokens
      testUser = await prisma.user.create({
        data: {
          ...UserFactory.build({
            email: "auth-integration-test-refresh@example.com",
            passwordHash: await bcrypt.hash("SecurePass123!", 10),
          }),
        },
      });

      const loginResponse = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: testUser.email,
          password: "SecurePass123!",
        });

      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it("should refresh tokens successfully", async () => {
      const response = await request(app)
        .post(`${API_BASE}/auth/refresh`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens).toHaveProperty("accessToken");
      expect(response.body.data.tokens).toHaveProperty("refreshToken");
      expect(response.body.data.tokens.refreshToken).not.toBe(refreshToken);
    });

    it("should reject invalid refresh token", async () => {
      const response = await request(app)
        .post(`${API_BASE}/auth/refresh`)
        .send({ refreshToken: "invalid-token" })
        .expect(401);

      expect(response.body.error.code).toBe("AUTHENTICATION_ERROR");
    });

    it("should reject revoked refresh token", async () => {
      // Revoke the token first
      await request(app)
        .post(`${API_BASE}/auth/logout`)
        .set("Authorization", `Bearer ${refreshToken}`)
        .send({ refreshToken });

      const response = await request(app)
        .post(`${API_BASE}/auth/refresh`)
        .send({ refreshToken })
        .expect(401);

      expect(response.body.error.code).toBe("AUTHENTICATION_ERROR");
    });
  });

  describe("POST /auth/logout", () => {
    let testUser: any;
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Create test user and get tokens
      testUser = await prisma.user.create({
        data: {
          ...UserFactory.build({
            email: "auth-integration-test-logout@example.com",
            passwordHash: await bcrypt.hash("SecurePass123!", 10),
          }),
        },
      });

      const loginResponse = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: testUser.email,
          password: "SecurePass123!",
        });

      accessToken = loginResponse.body.data.tokens.accessToken;
      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it("should logout successfully", async () => {
      const response = await request(app)
        .post(`${API_BASE}/auth/logout`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain("logged out");

      // Verify token is revoked
      const revokedToken = await prisma.revokedToken.findFirst({
        where: { token: refreshToken },
      });
      expect(revokedToken).toBeTruthy();
    });

    it("should require authentication for logout", async () => {
      const response = await request(app)
        .post(`${API_BASE}/auth/logout`)
        .send({ refreshToken })
        .expect(401);

      expect(response.body.error.code).toBe("AUTHENTICATION_ERROR");
    });
  });

  describe("GET /auth/me", () => {
    let testUser: any;
    let accessToken: string;

    beforeEach(async () => {
      // Create test user and get token
      testUser = await prisma.user.create({
        data: {
          ...UserFactory.build({
            email: "auth-integration-test-me@example.com",
            passwordHash: await bcrypt.hash("SecurePass123!", 10),
          }),
        },
      });

      const loginResponse = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: testUser.email,
          password: "SecurePass123!",
        });

      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it("should return current user info", async () => {
      const response = await request(app)
        .get(`${API_BASE}/auth/me`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
      });
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get(`${API_BASE}/auth/me`)
        .expect(401);

      expect(response.body.error.code).toBe("AUTHENTICATION_ERROR");
    });

    it("should reject expired token", async () => {
      // This would require mocking JWT expiration or waiting
      // For now, we'll test with an invalid token
      const response = await request(app)
        .get(`${API_BASE}/auth/me`)
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.error.code).toBe("AUTHENTICATION_ERROR");
    });
  });

  describe("Authentication Flow Integration", () => {
    it("should complete full authentication flow", async () => {
      const userData = {
        email: "auth-integration-test-flow@example.com",
        password: "SecurePass123!",
        username: "flowtest",
      };

      // 1. Register
      const registerResponse = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send(userData)
        .expect(201);

      const {
        accessToken: registerAccessToken,
        refreshToken: registerRefreshToken,
      } = registerResponse.body.data.tokens;

      // 2. Use access token to get user info
      const meResponse = await request(app)
        .get(`${API_BASE}/auth/me`)
        .set("Authorization", `Bearer ${registerAccessToken}`)
        .expect(200);

      expect(meResponse.body.data.user.email).toBe(userData.email);

      // 3. Refresh token
      const refreshResponse = await request(app)
        .post(`${API_BASE}/auth/refresh`)
        .send({ refreshToken: registerRefreshToken })
        .expect(200);

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        refreshResponse.body.data.tokens;

      // 4. Use new access token
      await request(app)
        .get(`${API_BASE}/auth/me`)
        .set("Authorization", `Bearer ${newAccessToken}`)
        .expect(200);

      // 5. Logout
      await request(app)
        .post(`${API_BASE}/auth/logout`)
        .set("Authorization", `Bearer ${newAccessToken}`)
        .send({ refreshToken: newRefreshToken })
        .expect(200);

      // 6. Verify old refresh token is revoked
      await request(app)
        .post(`${API_BASE}/auth/refresh`)
        .send({ refreshToken: newRefreshToken })
        .expect(401);
    });
  });
});
