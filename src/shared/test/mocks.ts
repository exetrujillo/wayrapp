/**
 * Mock Utilities for Testing
 * Provides mock implementations for services, repositories, and external dependencies
 */
import { Request, Response } from "express";
import { User } from "@prisma/client";
import { JWTPayload } from "@/shared/types";

/**
 * Create a mock Express request object
 */
export const mockRequest = (overrides: Partial<Request> = {}): Request => {
  const req = {
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    user: null,
    get: jest.fn().mockReturnValue("test-user-agent"),
    method: "GET",
    url: "/test",
    path: "/test",
    ip: "127.0.0.1",
    ...overrides,
  } as unknown as Request;

  return req;
};

/**
 * Create a mock Express response object
 */
export const mockResponse = (): Response => {
  const res = {} as Response;

  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.header = jest.fn().mockReturnValue(res);

  return res;
};

/**
 * Create a mock authenticated request with a user
 */
export const mockAuthRequest = (
  user: Partial<User> = {},
  overrides: Partial<Request> = {},
): Request => {
  const defaultUser: JWTPayload = {
    sub: user.id || "test-user-id",
    email: user.email || "test@example.com",
    role: (user.role as any) || "student",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  return mockRequest({
    user: defaultUser,
    ...overrides,
  });
};

/**
 * Create a mock next function for middleware testing
 */
export const mockNext = jest.fn();

/**
 * Mock JWT utilities
 */
export const mockJwt = {
  sign: jest.fn().mockReturnValue("mock-token"),
  verify: jest
    .fn()
    .mockReturnValue({ userId: "test-user-id", role: "student" }),
};

/**
 * Mock Prisma client for repository testing
 */
export const createMockPrismaClient = () => {
  return {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    course: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    level: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    section: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    module: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    lesson: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    exercise: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    lessonExercise: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    userProgress: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    lessonCompletion: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    revokedToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback()),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
};
