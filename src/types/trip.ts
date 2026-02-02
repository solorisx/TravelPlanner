import { z } from 'zod';

// TODO: Multi-user extension point - Add userId?: string to TripSchema when adding auth

// Base schemas
export const PlaceSchema = z.object({
  name: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  address: z.string().optional(),
  imageUrl: z.string().url().optional()
});

export const BookingSchema = z.object({
  url: z.string().url().optional(),
  confirmation: z.string().optional()
});

export const StopSchema = z.object({
  timeBlock: z.enum(['morning', 'midday', 'afternoon', 'evening']).optional(),
  place: PlaceSchema,
  category: z.enum(['scenic', 'food', 'culture', 'hike', 'lodging', 'misc']).optional(),
  durationMinutes: z.number().int().positive().optional(),
  costLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  booking: BookingSchema.optional(),
  notes: z.string().optional(),
  imageUrl: z.string().url().optional(),
  externalLinks: z.array(z.object({
    title: z.string().min(1),
    url: z.string().url()
  })).optional()
});

export const DriveEstimateSchema = z.object({
  hours: z.number().positive().optional(),
  km: z.number().positive().optional()
});

export const DaySchema = z.object({
  dayNumber: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start: PlaceSchema,
  end: PlaceSchema,
  driveEstimate: DriveEstimateSchema.optional(),
  stops: z.array(StopSchema).default([]),
  notes: z.string().optional(),
  googleMapsUrl: z.string().url().optional()
});

export const TravelersSchema = z.object({
  adults: z.number().int().nonnegative().optional(),
  kids: z.number().int().nonnegative().optional()
});

export const PreferencesSchema = z.object({
  pace: z.enum(['relaxed', 'balanced', 'packed']).optional(),
  dailyDriveHoursMax: z.number().positive().optional(),
  interests: z.array(z.string()).optional(),
  avoid: z.array(z.string()).optional(),
  budget: z.enum(['low', 'mid', 'high']).optional()
});

export const TripSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  travelers: TravelersSchema.optional(),
  preferences: PreferencesSchema.optional(),
  days: z.array(DaySchema).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// Input schemas for API endpoints
export const CreateTripSchema = TripSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const UpdateTripSchema = TripSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).partial();

export const UpdateDaySchema = DaySchema.omit({
  dayNumber: true
}).partial();

// Type inference
export type Trip = z.infer<typeof TripSchema>;
export type Day = z.infer<typeof DaySchema>;
export type Place = z.infer<typeof PlaceSchema>;
export type Stop = z.infer<typeof StopSchema>;
export type Travelers = z.infer<typeof TravelersSchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
export type CreateTripInput = z.infer<typeof CreateTripSchema>;
export type UpdateTripInput = z.infer<typeof UpdateTripSchema>;
export type UpdateDayInput = z.infer<typeof UpdateDaySchema>;
