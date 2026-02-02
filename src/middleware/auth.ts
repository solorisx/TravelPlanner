import { Request, Response, NextFunction } from 'express';

/**
 * Simple bearer token authentication middleware
 * Checks for "Authorization: Bearer <token>" header
 * Compares against API_TOKEN environment variable
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists
  if (!authHeader) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing Authorization header. Expected: "Authorization: Bearer <token>"'
    });
    return;
  }

  // Check if it's a Bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid Authorization header format. Expected: "Authorization: Bearer <token>"'
    });
    return;
  }

  const token = parts[1];
  const apiToken = process.env.API_TOKEN;

  // Check if API_TOKEN is configured
  if (!apiToken) {
    console.error('API_TOKEN environment variable not set');
    res.status(500).json({
      error: 'Server misconfiguration',
      message: 'API authentication not configured'
    });
    return;
  }

  // Validate token
  if (token !== apiToken) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API token'
    });
    return;
  }

  // Token is valid, proceed
  next();
}
