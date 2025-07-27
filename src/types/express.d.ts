/**
 * @module types/express
 * 
 * Express type extensions for authentication
 */

import { JWTPayload } from '@/shared/types';

declare global {
  namespace Express {
    export interface Request {
      user?: JWTPayload;
    }
  }
}