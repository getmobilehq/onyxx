import { Request } from 'express';
import { JWTPayload } from './user.types';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}