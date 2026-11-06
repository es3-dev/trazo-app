import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
export type AuthRequest = Request & { user?: { id: number; roles: string[] } };
export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Autenticación requerida' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest['user']; next(); }
  catch { return res.status(401).json({ error: 'Sesión no válida o expirada' }); }
};
/** ADMIN is kept as a valid alias of ADMINISTRADOR for migrated installations. */
export const isAdmin = (roles: string[] = []) => roles.some(r => r === 'ADMINISTRADOR' || r === 'ADMIN');
export const permit = (...allowed: string[]) => (req: AuthRequest, res: Response, next: NextFunction) =>
  (isAdmin(req.user?.roles) || req.user?.roles.some(r => allowed.includes(r))) ? next() : res.status(403).json({ error: 'No tiene permisos para esta acción' });
