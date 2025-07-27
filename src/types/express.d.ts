// src/types/express.d.ts
import { JWTPayload } from '@/shared/types';

declare global {
  namespace Express {
    export interface Request {
      user?: JWTPayload;
    }
  }
}