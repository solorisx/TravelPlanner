# Travel Plan App

A REST API for creating, managing, and publishing travel itineraries with beautiful HTML rendering.

## Features

- Create and manage multi-day travel plans
- Track daily routes, stops, and activities
- Set preferences (pace, budget, interests)
- Server-side HTML rendering with embedded CSS
- Static HTML publishing for sharing
- File-based JSON storage (no database required)
- Full TypeScript with Zod validation
- Search functionality across trips and stops

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express with CORS
- **Validation**: Zod (runtime + compile-time)
- **Templating**: EJS
- **Storage**: File-based JSON

## Prerequisites

- Node.js 18 or higher
- npm or yarn

## Setup

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment file:
   ```bash
   copy .env.example .env
   ```
   (On Unix/Mac: `cp .env.example .env`)

4. Start development server:
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:3000`

## Authentication

All API endpoints under `/api/trips` are protected with **Bearer token authentication**.

### Configuration

1. The API token is configured in your `.env` file:
   ```bash
   API_TOKEN=your-secure-token-here
   ```

2. **Generate a secure token** (recommended for production):
   ```bash
   openssl rand -hex 32
   ```
   Or on Windows PowerShell:
   ```powershell
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
   ```

3. **Development token**: The `.env` file includes a development token by default:
   ```
   API_TOKEN=dev_token_replace_in_production_d4e5f6a7b8c9
   ```

### Usage

Include the token in the `Authorization` header with Bearer scheme for all API requests:

```bash
curl http://localhost:3000/api/trips \
  -H "Authorization: Bearer dev_token_replace_in_production_d4e5f6a7b8c9"
```

### Public Endpoints

These endpoints do **not** require authentication:
- `GET /health` - Health check
- `GET /api/openapi.json` - OpenAPI specification
- `GET /published/{id}.html` - Static published HTML files

### Error Responses

**Missing Authorization header:**
```json
{
  "error": "Unauthorized",
  "message": "Missing Authorization header. Expected: \"Authorization: Bearer <token>\""
}
```

**Invalid token format:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid Authorization header format. Expected: \"Authorization: Bearer <token>\""
}
```

**Invalid token:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid API token"
}
```

### Security Best Practices

- **Never commit** your production API_TOKEN to version control
- **Use strong tokens** in production (32+ random characters)
- **Rotate tokens** periodically
- **Use HTTPS** when exposing via ngrok or public URLs
- The `.env.example` file contains a placeholder - replace it in your `.env`

## API Endpoints

**Authentication Required:** All endpoints below require the `Authorization: Bearer <token>` header.

### List Trips
```http
GET /api/trips
GET /api/trips?q=search_term
```

**Response:**
```json
{
  "trips": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Pacific Coast Highway Adventure",
      "updatedAt": "2026-02-02T10:00:00Z"
    }
  ]
}
```

### Create Trip
```http
POST /api/trips
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "My Trip",
  "startDate": "2026-06-01",
  "endDate": "2026-06-03",
  "travelers": {
    "adults": 2,
    "kids": 0
  },
  "preferences": {
    "pace": "balanced",
    "budget": "mid",
    "interests": ["hiking", "food"]
  },
  "days": [
    {
      "dayNumber": 1,
      "date": "2026-06-01",
      "start": { "name": "Seattle" },
      "end": { "name": "Portland" },
      "stops": []
    }
  ]
}
```

**Response:** Full trip object with generated `id`, `createdAt`, `updatedAt`

### Get Trip
```http
GET /api/trips/:id
```

**Response:** Full trip object

### Update Trip
```http
PATCH /api/trips/:id
Content-Type: application/json
```

**Request Body:** Partial trip updates
```json
{
  "title": "Updated Title",
  "preferences": {
    "pace": "relaxed"
  }
}
```

**Response:** Updated trip object

### Render Trip (HTML)
```http
GET /api/trips/:id/render
```

**Response:** HTML page (suitable for viewing in browser)

### Publish Trip (Static HTML)
```http
POST /api/trips/:id/publish
```

**Response:**
```json
{
  "url": "/published/550e8400-e29b-41d4-a716-446655440000.html",
  "path": "C:\\VSCode\\TravelPlanner\\public\\published\\550e8400-e29b-41d4-a716-446655440000.html"
}
```

Access published file at: `http://localhost:3000/published/{id}.html`

## Data Model

### Trip
- `id` (string, UUID) - Auto-generated
- `title` (string) - Trip name
- `startDate` (string, optional) - ISO format yyyy-mm-dd
- `endDate` (string, optional) - ISO format yyyy-mm-dd
- `travelers` (object, optional)
  - `adults` (number)
  - `kids` (number)
- `preferences` (object, optional)
  - `pace` (enum: relaxed | balanced | packed)
  - `dailyDriveHoursMax` (number)
  - `interests` (string[])
  - `avoid` (string[])
  - `budget` (enum: low | mid | high)
- `days` (Day[])
- `createdAt` (string) - ISO datetime, auto-generated
- `updatedAt` (string) - ISO datetime, auto-updated

### Day
- `dayNumber` (number) - Sequential day number
- `date` (string, optional) - ISO format yyyy-mm-dd
- `start` (Place) - Starting location
- `end` (Place) - Ending location
- `driveEstimate` (object, optional)
  - `hours` (number)
  - `km` (number)
- `stops` (Stop[])
- `notes` (string, optional)

### Stop
- `timeBlock` (enum, optional) - morning | midday | afternoon | evening
- `place` (Place)
- `category` (enum, optional) - scenic | food | culture | hike | lodging | misc
- `durationMinutes` (number, optional)
- `costLevel` (1 | 2 | 3 | 4, optional) - Represented as $ to $$$$
- `booking` (object, optional)
  - `url` (string)
  - `confirmation` (string)
- `notes` (string, optional)

### Place
- `name` (string)
- `lat` (number, optional)
- `lng` (number, optional)
- `address` (string, optional)

## Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Compile TypeScript to `dist/`
- `npm start` - Run production build
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
TravelPlanner/
├── src/
│   ├── server.ts              # Express app setup
│   ├── routes/
│   │   └── trips.ts           # Trip API routes
│   ├── services/
│   │   └── tripStore.ts       # File storage service
│   ├── templates/
│   │   ├── trip.ejs           # Main HTML template
│   │   └── partials/
│   │       └── _stop.ejs      # Stop component
│   ├── types/
│   │   └── trip.ts            # Zod schemas & types
│   ├── middleware/
│   │   ├── auth.ts            # Bearer token authentication
│   │   ├── validation.ts      # Request validation
│   │   └── errorHandler.ts    # Error handling
│   └── openapi/
│       └── spec.json          # OpenAPI 3.0 specification
├── data/
│   └── trips/                 # JSON storage
├── public/
│   └── published/             # Published HTML files
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Example Usage

**Note:** All examples below use the development token. Replace with your actual API_TOKEN value.

### Create a trip
```bash
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev_token_replace_in_production_d4e5f6a7b8c9" \
  -d "{\"title\":\"Weekend Getaway\",\"days\":[]}"
```

### Get trip
```bash
curl http://localhost:3000/api/trips/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer dev_token_replace_in_production_d4e5f6a7b8c9"
```

### Update trip
```bash
curl -X PATCH http://localhost:3000/api/trips/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev_token_replace_in_production_d4e5f6a7b8c9" \
  -d "{\"title\":\"Updated Weekend Getaway\"}"
```

### Publish trip
```bash
curl -X POST http://localhost:3000/api/trips/550e8400-e29b-41d4-a716-446655440000/publish \
  -H "Authorization: Bearer dev_token_replace_in_production_d4e5f6a7b8c9"
```

### Search trips
```bash
curl "http://localhost:3000/api/trips?q=pacific" \
  -H "Authorization: Bearer dev_token_replace_in_production_d4e5f6a7b8c9"
```

### View rendered trip
Open in browser with authentication: `http://localhost:3000/api/trips/550e8400-e29b-41d4-a716-446655440000/render`
(Note: Browser access requires adding the token as a query parameter or using a browser extension to add the Authorization header)

## Development

### Seed Data
An example trip is included at [data/trips/550e8400-e29b-41d4-a716-446655440000.json](data/trips/550e8400-e29b-41d4-a716-446655440000.json) demonstrating all features.

### Error Handling
- **400** - Validation errors (Zod schema violations)
- **404** - Trip not found
- **500** - Internal server errors

### Multi-User Extension
The codebase is designed for easy multi-user extension:
- Service layer abstraction (TripStore) for swappable storage
- TODO comments mark extension points in key files
- Clear migration path documented in the implementation plan

See [the implementation plan](C:\Users\Sascha\.claude\plans\squishy-jingling-coral.md) for details on adding authentication and user context.

## License

ISC
