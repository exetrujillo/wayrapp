/**
 * Authentication Utilities
 * JWT token generation, validation, and user authentication helpers
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWTPayload, UserRole } from '@/shared/types';
import { logger } from './logger';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const jwtSecret = process.env['JWT_SECRET'];
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable not set');
  }

  const jwtPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: payload.userId,
    email: payload.email,
    role: payload.role
  };

  return jwt.sign(jwtPayload, jwtSecret, {
    expiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] || '15m',
    issuer: 'wayrapp-api',
    audience: 'wayrapp-client'
  } as any);
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  const jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'];
  if (!jwtRefreshSecret) {
    throw new Error('JWT_REFRESH_SECRET environment variable not set');
  }

  const jwtPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: payload.userId,
    email: payload.email,
    role: payload.role
  };

  return jwt.sign(jwtPayload, jwtRefreshSecret, {
    expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
    issuer: 'wayrapp-api',
    audience: 'wayrapp-client'
  } as any);
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (payload: TokenPayload): TokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  const jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'];
  if (!jwtRefreshSecret) {
    throw new Error('JWT_REFRESH_SECRET environment variable not set');
  }

  return jwt.verify(token, jwtRefreshSecret) as JWTPayload;
};

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = parseInt(process.env['BCRYPT_SALT_ROUNDS'] || '12');
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1] || null;
};

/**
 * Validate token format and structure
 */
export const validateTokenFormat = (token: string): boolean => {
  try {
    // Basic JWT format validation (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Try to decode header and payload (without verification)
    const header = JSON.parse(Buffer.from(parts[0]!, 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1]!, 'base64').toString());
    
    // Basic structure validation
    return !!(header.alg && header.typ && payload.sub && payload.exp);
  } catch (error: any) {
    logger.debug('Token format validation failed', { error: error.message });
    return false;
  }
};

/**
 * Check if token is expired (without verification)
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(Buffer.from(parts[1]!, 'base64').toString());
    const now = Math.floor(Date.now() / 1000);
    
    return payload.exp < now;
  } catch (error: any) {
    logger.debug('Token expiration check failed', { error: error.message });
    return true;
  }
};

/**
 * Get token expiration time
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1]!, 'base64').toString());
    
    // Check if exp claim exists and is a valid number
    if (!payload.exp || typeof payload.exp !== 'number') {
      return null;
    }
    
    return new Date(payload.exp * 1000);
  } catch (error: any) {
    logger.debug('Token expiration extraction failed', { error: error.message });
    return null;
  }
};

/**
 * Generate secure random string for tokens
 */
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};