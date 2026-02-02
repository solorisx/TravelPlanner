import * as fs from 'fs/promises';
import * as path from 'path';
import { Trip, TripSchema, Day } from '../types/trip';
import { randomUUID } from 'crypto';

// TODO: Multi-user extension point - Add userId parameter to methods to filter by user

export class TripStore {
  private dataDir: string;

  constructor(dataDir: string = './data/trips') {
    this.dataDir = path.resolve(dataDir);
  }

  // Ensure directory exists
  async initialize(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
  }

  // Generate file path from trip ID
  private getFilePath(id: string): string {
    return path.join(this.dataDir, `${id}.json`);
  }

  // Atomic write: write to temp file, then rename
  private async atomicWrite(filePath: string, data: string): Promise<void> {
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, data, 'utf-8');
    await fs.rename(tempPath, filePath);
  }

  // Create new trip
  async create(tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
    const now = new Date().toISOString();
    const trip: Trip = {
      ...tripData,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now
    };

    // Validate before saving
    const validated = TripSchema.parse(trip);

    const filePath = this.getFilePath(validated.id);
    await this.atomicWrite(filePath, JSON.stringify(validated, null, 2));

    return validated;
  }

  // Read trip by ID
  async read(id: string): Promise<Trip | null> {
    try {
      const filePath = this.getFilePath(id);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      return TripSchema.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }

  // Update trip (partial merge)
  async update(
    id: string,
    updates: Partial<Omit<Trip, 'id' | 'createdAt'>>
  ): Promise<Trip | null> {
    const existing = await this.read(id);
    if (!existing) return null;

    const updated: Trip = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    };

    const validated = TripSchema.parse(updated);

    const filePath = this.getFilePath(id);
    await this.atomicWrite(filePath, JSON.stringify(validated, null, 2));

    return validated;
  }

  // List all trips
  async list(): Promise<Array<Pick<Trip, 'id' | 'title' | 'updatedAt'>>> {
    const files = await fs.readdir(this.dataDir);
    const tripFiles = files.filter(f => f.endsWith('.json') && !f.endsWith('.tmp'));

    const trips = await Promise.all(
      tripFiles.map(async (file) => {
        const id = path.basename(file, '.json');
        const trip = await this.read(id);
        return trip ? { id: trip.id, title: trip.title, updatedAt: trip.updatedAt } : null;
      })
    );

    return trips
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  // Search trips (bonus feature)
  async search(query: string): Promise<Array<Pick<Trip, 'id' | 'title' | 'updatedAt'>>> {
    const files = await fs.readdir(this.dataDir);
    const tripFiles = files.filter(f => f.endsWith('.json') && !f.endsWith('.tmp'));

    const lowerQuery = query.toLowerCase();

    const matchingTrips = await Promise.all(
      tripFiles.map(async (file) => {
        const id = path.basename(file, '.json');
        const trip = await this.read(id);
        if (!trip) return null;

        // Search in title
        if (trip.title.toLowerCase().includes(lowerQuery)) {
          return { id: trip.id, title: trip.title, updatedAt: trip.updatedAt };
        }

        // Search in stop place names
        const hasMatchingStop = trip.days.some(day =>
          day.stops.some(stop => stop.place.name.toLowerCase().includes(lowerQuery))
        );

        if (hasMatchingStop) {
          return { id: trip.id, title: trip.title, updatedAt: trip.updatedAt };
        }

        return null;
      })
    );

    return matchingTrips
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  // Update a specific day within a trip (partial merge)
  async updateDay(
    id: string,
    dayNumber: number,
    dayUpdates: Partial<Omit<Day, 'dayNumber'>>
  ): Promise<Trip | null> {
    const existing = await this.read(id);
    if (!existing) return null;

    // Find the day to update
    const dayIndex = existing.days.findIndex(d => d.dayNumber === dayNumber);
    if (dayIndex === -1) {
      throw new Error(`Day ${dayNumber} not found in trip`);
    }

    // Merge updates with existing day
    const updatedDay: Day = {
      ...existing.days[dayIndex],
      ...dayUpdates,
      dayNumber: existing.days[dayIndex].dayNumber // Ensure dayNumber is not changed
    };

    // Update the days array
    const updatedDays = [...existing.days];
    updatedDays[dayIndex] = updatedDay;

    // Update the trip with the modified days array
    const updated: Trip = {
      ...existing,
      days: updatedDays,
      updatedAt: new Date().toISOString()
    };

    const validated = TripSchema.parse(updated);

    const filePath = this.getFilePath(id);
    await this.atomicWrite(filePath, JSON.stringify(validated, null, 2));

    return validated;
  }
}
