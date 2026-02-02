import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import session from 'express-session';
import tripRoutes from './routes/trips';
import webRoutes from './routes/web';
import { errorHandler } from './middleware/errorHandler';
import { requireAuth } from './middleware/auth';

// Load environment variables
dotenv.config();

// TODO: Multi-user extension point - Add authentication middleware configuration here

const requiredEnvVars = ['API_TOKEN', 'SESSION_SECRET', 'WEB_USERNAME', 'WEB_PASSWORD'] as const;
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Create a .env file based on .env.example before starting the server.');
  process.exit(1);
}

const insecureDefaults = new Set([
  'your-secure-token-here',
  'dev_token_replace_in_production_d4e5f6a7b8c9',
  'your-session-secret-here',
  'your-username',
  'your-password'
]);
const insecureEnvVars = requiredEnvVars.filter((name) => {
  const value = process.env[name];
  return value ? insecureDefaults.has(value) : false;
});

if (insecureEnvVars.length > 0) {
  console.warn(
    `Insecure placeholder values detected for: ${insecureEnvVars.join(', ')}. ` +
      'Replace them with strong, unique values before exposing the server publicly.'
  );
}

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? '*' : undefined
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware for web UI authentication
app.use(session({
  secret: process.env.SESSION_SECRET as string,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

// Static files (for published HTML)
app.use('/published', express.static(path.join(__dirname, '../public/published')));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// OpenAPI specification
app.get('/api/openapi.json', (_req: Request, res: Response) => {
  const spec = require('./openapi/spec.json');
  res.json(spec);
});

// API routes (protected with bearer token authentication)
app.use('/api/trips', requireAuth, tripRoutes);

// Web UI routes (protected with session authentication)
app.use('/', webRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
