import { Router, Request, Response } from 'express';
import { requireSession } from '../middleware/sessionAuth';
import { TripStore } from '../services/tripStore';
import path from 'path';

const router = Router();
const tripStore = new TripStore();

/**
 * GET /login
 * Render login page
 */
router.get('/login', (req: Request, res: Response) => {
  // If already authenticated, redirect to trips list
  if (req.session && req.session.authenticated) {
    res.redirect('/trips');
    return;
  }

  res.render('login', { error: null });
});

/**
 * POST /login
 * Handle login form submission
 */
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  const validUsername = process.env.WEB_USERNAME || 'admin';
  const validPassword = process.env.WEB_PASSWORD || 'admin123';

  if (username === validUsername && password === validPassword) {
    // Set session
    req.session.authenticated = true;
    req.session.username = username;

    res.redirect('/trips');
  } else {
    res.render('login', { error: 'Invalid username or password' });
  }
});

/**
 * GET /logout
 * Destroy session and redirect to login
 */
router.get('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    res.redirect('/login');
  });
});

/**
 * GET /trips
 * List all trips with links (HTML)
 */
router.get('/trips', requireSession, async (req: Request, res: Response) => {
  try {
    const trips = await tripStore.list();
    res.render('trip-list', {
      trips,
      username: req.session.username
    });
  } catch (error) {
    console.error('Error listing trips:', error);
    res.status(500).send('Error loading trips');
  }
});

/**
 * GET /trips/:id
 * Render single trip HTML (reuse existing trip.ejs template)
 */
router.get('/trips/:id', requireSession, async (req: Request, res: Response) => {
  try {
    const trip = await tripStore.read(req.params.id);
    res.render('trip', { trip });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      res.status(404).send('Trip not found');
    } else {
      console.error('Error loading trip:', error);
      res.status(500).send('Error loading trip');
    }
  }
});

export default router;
