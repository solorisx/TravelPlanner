import { Router, Request, Response } from 'express';
import { TripStore } from '../services/tripStore';
import { CreateTripSchema, UpdateTripSchema, UpdateDaySchema } from '../types/trip';
import { validateBody } from '../middleware/validation';
import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs/promises';

// TODO: Multi-user extension point - Add auth middleware before routes

const router = Router();
const tripStore = new TripStore();

// Initialize store
tripStore.initialize().catch(console.error);

// GET /api/trips - List all trips
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string | undefined;

    if (query) {
      const trips = await tripStore.search(query);
      res.json({ trips, query });
    } else {
      const trips = await tripStore.list();
      res.json({ trips });
    }
  } catch (error) {
    console.error('Error listing trips:', error);
    res.status(500).json({ error: 'Failed to list trips' });
  }
});

// POST /api/trips - Create trip
router.post('/', validateBody(CreateTripSchema), async (req: Request, res: Response) => {
  try {
    const trip = await tripStore.create(req.body);
    res.status(201).json(trip);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// GET /api/trips/:id - Get trip
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const trip = await tripStore.read(id);

    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    res.json(trip);
  } catch (error) {
    console.error('Error reading trip:', error);
    res.status(500).json({ error: 'Failed to read trip' });
  }
});

// PATCH /api/trips/:id - Update trip
router.patch('/:id', validateBody(UpdateTripSchema), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const trip = await tripStore.update(id, req.body);

    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    res.json(trip);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// GET /api/trips/:id/render - Render HTML
router.get('/:id/render', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const trip = await tripStore.read(id);

    if (!trip) {
      res.status(404).send('<h1>Trip not found</h1>');
      return;
    }

    const templatePath = path.resolve(__dirname, '../templates/trip.ejs');
    const html = await ejs.renderFile(templatePath, { trip });

    res.send(html);
  } catch (error) {
    console.error('Error rendering trip:', error);
    res.status(500).send('<h1>Error rendering trip</h1>');
  }
});

// POST /api/trips/:id/publish - Publish static HTML
router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const trip = await tripStore.read(id);

    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    // Render HTML
    const templatePath = path.resolve(__dirname, '../templates/trip.ejs');
    const html = await ejs.renderFile(templatePath, { trip, published: true });

    // Save to public directory
    const publicDir = path.resolve(__dirname, '../../public/published');
    await fs.mkdir(publicDir, { recursive: true });

    const outputPath = path.join(publicDir, `${trip.id}.html`);
    await fs.writeFile(outputPath, html, 'utf-8');

    res.json({
      url: `/published/${trip.id}.html`,
      path: outputPath
    });
  } catch (error) {
    console.error('Error publishing trip:', error);
    res.status(500).json({ error: 'Failed to publish trip' });
  }
});

// PATCH /api/trips/:id/days/:dayNumber - Update specific day
router.patch('/:id/days/:dayNumber', validateBody(UpdateDaySchema), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const dayNumber = parseInt(String(req.params.dayNumber), 10);

    if (isNaN(dayNumber) || dayNumber < 1) {
      res.status(400).json({ error: 'Invalid day number' });
      return;
    }

    const trip = await tripStore.updateDay(id, dayNumber, req.body);

    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    res.json(trip);
  } catch (error: any) {
    if (error.message && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Error updating day:', error);
    res.status(500).json({ error: 'Failed to update day' });
  }
});

export default router;
