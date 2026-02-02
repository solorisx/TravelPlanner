import { Request, Response, NextFunction } from 'express';

// Extend Express Session type
declare module 'express-session' {
  interface SessionData {
    authenticated: boolean;
    username: string;
  }
}

/**
 * Middleware to check if user is authenticated via session
 * Redirects to /login if not authenticated
 */
export function requireSession(req: Request, res: Response, next: NextFunction): void {
  if (req.session && req.session.authenticated) {
    next();
  } else {
    res.redirect('/login');
  }
}
