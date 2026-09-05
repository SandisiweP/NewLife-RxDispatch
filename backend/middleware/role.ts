import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Role } from '@prisma/client';

export const requireRole = (allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access forbidden: Insufficient permissions' });
    }
    next();
  };
};