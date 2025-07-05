---

# Scheduler - Self-Hosted Calendly Alternative

This is a self-hosted scheduling application built with Bun, Effect-TS, and React. Follow these guidelines when working on this codebase.

## Core Technologies

- **Runtime**: Bun (NOT Node.js)
- **Backend**: Effect-TS with effect/platform for HTTP APIs
- **Frontend**: Astro + TypeScript with shadcn/ui and Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Linter**: Biome
- **Database**: SQLite via bun:sqlite
- **Monorepo**: Bun workspaces

## Current Development Status

### ✅ Completed

- **ConfigService**: Type-safe environment variable loading with `Config.string()`, `Config.redacted()`, and fallback defaults
- **TelemetryService**: ConsoleSpanExporter for prototype telemetry, depends on ConfigService
- **Testing Infrastructure**: Bun test setup with >80% coverage requirement
- **Project Structure**: Monorepo with workspace scripts and proper Effect patterns
- **CLI Helper**: Interactive setup assistant (`bun run init`) for generating .env with Google OAuth credentials
- **Environment Variable Loading**: ConfigService now loads all required env vars with type-safe defaults
- **GoogleCalendarService**: Mock booking-focused calendar service with `getAvailableSlots()`, `bookSlot()`, and `checkAvailability()`
- **EmailService**: Simple mock email service with `sendBookingConfirmation()`, `sendBookingCancellation()`, and `sendEmail()`
- **HttpApiService**: Type-safe API definitions using HttpApi, HttpApiGroup, and HttpApiEndpoint
- **Backend Refactor**: Complete refactor of all services using proper Effect patterns and service definitions

### 🚧 In Progress: Frontend Development

**Goal**: Build Astro frontend with shadcn/ui components and Tailwind CSS 4, then connect to backend API.

**The Flow**:

```bash
# 1. Clone repo and setup
git clone scheduler && cd scheduler
bun install

# 2. Run CLI helper to create .env with OAuth credentials  
bun run init

# 3. Start main application (reads .env)
bun dev
```

**Architecture**:

- **GoogleCalendarService**: ✅ Mock service returning hardcoded available slots for booking
- **EmailService**: ✅ Simple mock service for sending notifications (just logs and returns confirmation)
- **HttpApiService**: ✅ Type-safe API definitions using HttpApi, HttpApiGroup, and HttpApiEndpoint
- **Frontend**: 🚧 Astro site with shadcn/ui components and Tailwind CSS 4
- **HttpClient**: 🚧 Service middleware for type-safe API communication

### 🎯 Next Steps

1. **Create HttpClient Service** - Type-safe HTTP client middleware:
   ```ts
   export class HttpClientService extends Effect.Service<HttpClientService>()("app/HttpClientService", {
     effect: Effect.gen(function* () {
       // Type-safe HTTP client for API communication
       return { get, post, put, delete: deleteRequest }
     })
   })
   ```

2. **Astro Frontend Setup** - Initialize Astro project with modern tooling:
   - Create `packages/frontend/` with Astro + TypeScript
   - Setup shadcn/ui components with Tailwind CSS 4
   - Configure Astro for SSR/SSG hybrid rendering

3. **Core UI Components** - Build essential scheduling interface:
   - `CalendarWeekView` - Week view with available time slots
   - `BookingForm` - Guest booking form with validation
   - `BookingConfirmation` - Success/error messaging
   - `TimeSlotPicker` - Interactive time selection

4. **API Integration** - Connect frontend to backend:
   - Type-safe API client using HttpClient service
   - Client-side state management for booking flow
   - Error handling and loading states

**Current Focus**: Build Astro frontend with shadcn/ui components and connect to backend API.

## Bun-Specific Guidelines

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

### APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Development Approach: Prototype First

**IMPORTANT**: Before implementing any actual integrations, we build a complete working prototype using mock implementations:

### Phase 1: Mock Implementation ✅

- **Environment Variables**: Use fake/hardcoded values ✅
- **Database**: Use localStorage or in-memory stores (pending)
- **Google Calendar**: Mock API responses ✅
- **Email**: Use console.log notifications ✅
- **Telemetry**: Use Effect's Console telemetry provider ✅
- **Authentication**: Mock OAuth flow with fake tokens (pending)

### Phase 2: Frontend Prototype 🚧

- **HTTP API**: ✅ Type-safe endpoints with Effect HttpApi
- **HttpClient**: 🚧 Service middleware for type-safe API communication
- **Astro Frontend**: 🚧 SSR/SSG hybrid with shadcn/ui components
- **Calendar UI**: 🚧 Week view with time slot selection
- **Booking Flow**: 🚧 Guest booking form with validation
- **End-to-End Flow**: 🚧 Complete booking process without external dependencies

### Why Prototype First?

1. ✅ Validate the complete service layer chain works end-to-end
2. ✅ Test business logic without external dependencies
3. ✅ Rapid iteration on API design and user flows
4. ✅ Easy to demonstrate and test locally

### What We've Learned

1. **Effect.Service Pattern**: `succeed: { method: () => Effect }` works perfectly for simple mocks
2. **Schema Design**: Keep schemas minimal - use `Schema.Struct` over `Schema.Class` for data
3. **Testing Strategy**: One test file per service with comprehensive coverage
4. **Mock Simplicity**: Return hardcoded data, not complex logic - easier to reason about
5. **Service Dependencies**: EmailService works independently, GoogleCalendarService provides data

### Current Mock Strategy

```ts
// Simple mock service - just return hardcoded data
export class GoogleCalendarService extends Effect.Service<GoogleCalendarService>()(
  "app/GoogleCalendarService",
  {
    succeed: {
      getAvailableSlots: (weekStart: string) =>
        Effect.gen(function* () {
          yield* Effect.log(`Mock: Getting slots for ${weekStart}`)
          return [
            { start: "2025-07-07T09:00:00.000Z", end: "2025-07-07T09:30:00.000Z" },
            { start: "2025-07-07T10:00:00.000Z", end: "2025-07-07T10:30:00.000Z" },
            // ... more hardcoded slots
          ]
        })
    }
  }
) {}

// Switch to live implementation later
export const GoogleCalendarServiceLive = Layer.effect(
  GoogleCalendarService,
  Effect.gen(function* () {
    const config = yield* ConfigService
    // Real Google Calendar API calls here
  })
)
```

## Effect-TS Patterns

### Service Definition

Use `Effect.Service` for cleaner service definitions with built-in layer generation:

```ts
import { Effect } from "effect"

// Define service with Effect.Service using sync for simple values
export class ConfigService extends Effect.Service<ConfigService>()(
  "app/ConfigService",
  {
    sync: () => ({
      getAppName: () => "Scheduler",
      getVersion: () => "1.0.0-prototype",
      getEnvironment: () => "development"
    })
  }
) {}

// Define service that returns a layer directly
import { NodeSdk } from "@effect/opentelemetry"
import { ConsoleSpanExporter, BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"

export class TelemetryService extends Effect.Service<TelemetryService>()(
  "app/TelemetryService",
  {
    effect: Effect.gen(function* () {
      const config = yield* ConfigService
      
      // Return the telemetry layer directly
      return NodeSdk.layer(() => ({
        resource: { serviceName: config.getAppName() },
        spanProcessor: new BatchSpanProcessor(new ConsoleSpanExporter())
      }))
    }),
    dependencies: [ConfigService.Default]
  }
) {}

// Use the auto-generated layers
const MainLive = Layer.mergeAll(
  ConfigService.Default,
  TelemetryService.Default
)
```

**Service Constructor Options:**

- `sync: () => implementation` - For simple synchronous services
- `effect: Effect.gen(...)` - For services requiring initialization
- `succeed: implementation` - For static implementations
- `scoped: Effect.gen(...)` - For services with lifecycle management

**Note**: For services without sensible defaults (e.g., contextual services), use `Context.GenericTag` instead.

### HTTP API with @effect/platform

Define type-safe HTTP APIs using `HttpApi`:

```ts
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "@effect/schema"

// Define API specification
export const api = HttpApi.empty.pipe(
  HttpApi.addGroup(
    HttpApiGroup.make("booking").pipe(
      HttpApiGroup.add(
        HttpApiEndpoint.post("create", "/booking").pipe(
          HttpApiEndpoint.setPayload(
            Schema.Struct({
              guestEmail: Schema.String,
              startTime: Schema.DateTimeUtc,
              duration: Schema.Number
            })
          ),
          HttpApiEndpoint.addSuccess(
            Schema.Struct({ eventId: Schema.String })
          ),
          HttpApiEndpoint.addError(Schema.String)
        )
      )
    )
  )
)

// Implement the API handler
export class BookingHandlers extends Effect.Service<BookingHandlers>()(
  "app/BookingHandlers",
  {
    effect: Effect.gen(function* () {
      const booking = yield* BookingService
      
      return HttpApiBuilder.group(api, "booking", {
        create: (input) => 
          booking.create(input).pipe(
            Effect.map((event) => ({ eventId: event.id }))
          )
      })
    }),
    dependencies: [BookingService.Default]
  }
) {}
```

### HttpClient Service Pattern

For type-safe API communication between frontend and backend:

```ts
import { HttpClient } from "@effect/platform"
import { Schema } from "@effect/schema"

// Define API schemas
const BookingRequest = Schema.Struct({
  guestEmail: Schema.String,
  startTime: Schema.DateTimeUtc,
  duration: Schema.Number
})

const BookingResponse = Schema.Struct({
  eventId: Schema.String,
  status: Schema.String
})

// HttpClient service for API communication
export class ApiClientService extends Effect.Service<ApiClientService>()(
  "app/ApiClientService",
  {
    effect: Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      
      const createBooking = (request: typeof BookingRequest.Type) =>
        client.post("/api/booking").pipe(
          HttpClient.schemaBodyJson(BookingRequest),
          HttpClient.schemaBodyJson(request),
          HttpClient.schemaJson(BookingResponse),
          Effect.scoped
        )
      
      const getAvailableSlots = (weekStart: string) =>
        client.get(`/api/availability/${weekStart}`).pipe(
          HttpClient.schemaJson(Schema.Array(Schema.Struct({
            start: Schema.DateTimeUtc,
            end: Schema.DateTimeUtc
          }))),
          Effect.scoped
        )
      
      return { createBooking, getAvailableSlots }
    })
  }
) {}
```

### Error Handling

Define typed errors using `Schema.TaggedError` for better integration:

```ts
import { Schema } from "@effect/schema"

// Define errors with Schema for serialization support
export class GoogleCalendarError extends Schema.TaggedError<GoogleCalendarError>()(
  "GoogleCalendarError",
  {
    message: Schema.String,
    code: Schema.optional(Schema.String)
  }
) {}

export class ValidationError extends Schema.TaggedError<ValidationError>()(
  "ValidationError", 
  {
    field: Schema.String,
    message: Schema.String
  }
) {}
```

### Telemetry Patterns

For prototype telemetry, use Effect's built-in tracing with ConsoleSpanExporter:

```ts
// Create a telemetry service that returns a layer directly
import { NodeSdk } from "@effect/opentelemetry"
import { ConsoleSpanExporter, BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"

export class TelemetryService extends Effect.Service<TelemetryService>()(
  "app/TelemetryService",
  {
    effect: Effect.gen(function* () {
      const config = yield* ConfigService
      
      return NodeSdk.layer(() => ({
        resource: { serviceName: config.getAppName() },
        spanProcessor: new BatchSpanProcessor(new ConsoleSpanExporter())
      }))
    }),
    dependencies: [ConfigService.Default]
  }
) {}

// Use Effect.withSpan directly in application code
const program = Effect.gen(function* () {
  const config = yield* ConfigService
  
  const result = yield* Effect.gen(function* () {
    yield* Effect.annotateCurrentSpan("appName", config.getAppName())
    yield* Effect.annotateCurrentSpan("version", config.getVersion())
    
    yield* Effect.log(`Starting ${config.getAppName()}`)
    
    return "Application started successfully"
  }).pipe(
    Effect.withSpan("app-startup", {
      attributes: {
        "app.operation": "startup",
        "app.name": config.getAppName(),
        "app.version": config.getVersion()
      }
    })
  )
  
  return result
})

// Provide telemetry layer to the program
Effect.gen(function* () {
  const telemetryLayer = yield* TelemetryService
  const result = yield* program.pipe(Effect.provide(telemetryLayer))
  return result
}).pipe(
  Effect.provide(MainLive),
  Effect.runPromise
)
```

**Key Telemetry Patterns:**

- Services can return layers directly for cleaner composition
- Use `Effect.withSpan(name, options)` for creating spans with attributes
- Use `Effect.annotateCurrentSpan(key, value)` for runtime annotations
- ConsoleSpanExporter outputs span data to console for development
- Log messages automatically become span events

## Project Structure

```
scheduler/
├── packages/
│   ├── backend/           # Effect-TS backend services
│   │   ├── src/
│   │   │   ├── services/  # Effect service layers (✅ Complete)
│   │   │   │   ├── ConfigService.ts
│   │   │   │   ├── EmailService.ts
│   │   │   │   ├── GoogleCalendarService.ts
│   │   │   │   ├── HttpApiService.ts
│   │   │   │   └── TelemetryService.ts
│   │   │   └── tests/     # Service tests (✅ Complete)
│   │   ├── index.ts       # Entry point
│   │   ├── init.ts        # CLI helper
│   │   └── package.json
│   ├── frontend/          # Astro frontend (🚧 Planned)
│   │   ├── src/
│   │   │   ├── components/     # shadcn/ui components
│   │   │   ├── layouts/        # Astro layouts
│   │   │   ├── pages/          # Astro pages
│   │   │   └── lib/            # Utilities
│   │   ├── astro.config.mjs
│   │   ├── tailwind.config.js
│   │   └── package.json
│   └── shared/            # Shared types and schemas
│       └── src/
├── biome.json             # Linter configuration
├── CLAUDE.md              # Development guidelines
├── package.json           # Root workspace config
└── docker-compose.yml
```

## Workspace Scripts

**Root level scripts** (delegate to packages via `--filter`):

- `bun dev` → Start backend server (port 8080) and frontend dev server (port 3000)
- `bun test` → Run ALL tests (backend unit + E2E, requires servers running)
- `bun test:backend` → Run only backend unit tests (fast, no servers needed)
- `bun test:e2e` → Run only E2E tests (requires servers running)
- `bun test:coverage` → `bun run --filter backend test:coverage`
- `bun check` → `bun run --filter backend check`
- `bun typecheck` → `bun run --filter backend typecheck`

## Frontend with Astro

For the prototype, use Astro with Bun for fast development:

```ts
// packages/frontend/astro.config.mjs
import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import react from '@astrojs/react'

export default defineConfig({
  integrations: [tailwind(), react()],
  output: 'hybrid',
  adapter: import('@astrojs/node'),
  server: {
    port: 3000,
    host: true
  }
})
```

```astro
---
// packages/frontend/src/pages/index.astro
import Layout from '../layouts/Layout.astro'
import CalendarWeekView from '../components/CalendarWeekView.tsx'
---

<Layout title="Scheduler">
  <main class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Schedule a Meeting</h1>
    <CalendarWeekView client:load />
  </main>
</Layout>
```

```tsx
// packages/frontend/src/components/CalendarWeekView.tsx
import { useState } from 'react'
import { Button } from './ui/button'

export default function CalendarWeekView() {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  
  return (
    <div className="grid grid-cols-7 gap-4">
      {/* Time slots grid */}
    </div>
  )
}
```

## Testing

### Backend Unit Tests (Bun Test)

**Structure:**
- Tests are located in `src/tests/` directory
- One test file per service: `ServiceName.test.ts`
- Use prototype layers for testing (no separate test layers)

**Basic Service Test:**
```ts
import { expect, test, describe } from "bun:test"
import { Effect } from "effect"
import { ServiceName } from "../services/ServiceName.js"

describe("ServiceName", () => {
  test("should do something", async () => {
    const program = Effect.gen(function* () {
      const service = yield* ServiceName
      const result = yield* service.method(params)
      return result
    })

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(ServiceName.Default))
    )

    expect(result).toBe(expected)
  })
})
```

**Error Testing with Effect.flip:**
```ts
test("should handle errors with Effect.flip", async () => {
  const program = Effect.gen(function* () {
    const service = yield* ServiceName
    const result = yield* service.method(invalidParams)
    return result
  })

  const result = await Effect.runPromise(
    program.pipe(Effect.provide(ServiceName.Default), Effect.flip)
  )

  expect(ParseResult.isParseError(result)).toBe(true)
})
```

**Backend Testing Rules:**
1. **Use Effect.flip for error testing** (NOT Effect.either)
2. **Tests use prototype layers directly** (ServiceName.Default)
3. **Use ParseResult.isParseError(result)** for schema validation errors
4. **Maintain >80% code coverage**
5. **One test file per service**

### E2E Testing with Playwright

**Implementation Status:** ✅ Complete with cross-browser testing (Chromium, Firefox, Mobile Chrome)

**Playwright Best Practices (learned through implementation):**
- **Test user-visible behavior** - Focus on what end users see and interact with
- **Use semantic locators** - `getByRole()`, `getByText()` over CSS selectors
- **Be specific with selectors** - Use exact text matches when multiple elements exist
- **Auto-retrying assertions** - Use `await expect()` for web-first assertions
- **Test isolation** - Clear localStorage and cookies in `beforeEach`
- **Debug with screenshots** - Take temporary screenshots when tests fail unexpectedly

**Working Test Structure:**
```ts
import { test, expect } from '@playwright/test'

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first, then clear session data to avoid localStorage errors
    await page.goto('http://localhost:3000')
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
  })

  test('should display calendar view on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    // Use getByText for non-semantic elements, getByRole for semantic ones
    await expect(page.getByText('Schedule a Meeting')).toBeVisible()
    await expect(page.getByRole('button', { name: /available/i })).toBeVisible()
  })

  test('should complete booking flow', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    // Click time slot
    await page.getByRole('button', { name: /9:00 AM/i }).click()
    
    // Fill booking form
    await page.getByRole('textbox', { name: /email/i }).fill('guest@example.com')
    await page.getByRole('button', { name: /book meeting/i }).click()
    
    // Be specific - use getByRole with exact name when multiple elements exist
    await expect(page.getByRole('heading', { name: 'Booking Confirmed' })).toBeVisible()
  })
})
```

**Critical E2E Gotchas Learned:**
1. **Navigate before localStorage** - Always `page.goto()` before `localStorage.clear()` to avoid security errors
2. **Multiple element conflicts** - Use specific selectors like `getByRole('heading', { name: 'Booking Confirmed' })` not `getByText('Booking Confirmed')`
3. **File naming** - Use `-e2e.ts` suffix to avoid Bun test runner conflicts
4. **Browser dependencies** - Skip WebKit/Safari on systems missing graphics libraries

**E2E Test Coverage:**
- Calendar view display and time slot selection
- Booking form validation and submission
- Booking confirmation flow
- Error handling and messaging
- Cross-browser compatibility (Chromium, Firefox, Mobile Chrome)

**Directory Structure:**
```
packages/backend/src/tests/     # Unit tests (Bun test runner)
packages/frontend/e2e/          # E2E tests (Playwright test runner)  
├── booking-e2e.ts             # Booking flow tests
├── calendar-e2e.ts            # Calendar view tests
└── playwright.config.ts       # Multi-browser test configuration
```

**Important:** E2E tests use `-e2e.ts` suffix to avoid conflict with Bun's test discovery pattern.

### Test Scripts

**Root Commands (run from project root):**
- `bun run test` - Run ALL tests (backend + E2E, requires servers running)
- `bun run test:backend` - Run only backend unit tests (fast, ~500ms)
- `bun run test:e2e` - Run only E2E tests (requires servers running)

**Frontend Commands (from packages/frontend):**
- `bun test:e2e` - Run E2E tests (standard reporter)
- `bun test:e2e:ui` - Run E2E tests with Playwright UI mode
- `bun test:e2e:debug` - Run E2E tests in debug mode (opens browser)
- `bun test:e2e --reporter=line` - Run with programmatic line output

**Complete Test Workflows:**

Quick backend-only testing:
```bash
bun test  # Just backend unit tests, no servers needed
```

Full testing (backend + E2E):
```bash
# Terminal 1: Start servers
bun run dev

# Terminal 2: Run all tests  
bun run test
```

## Key Features to Implement

1. **Google OAuth 2.0**: Owner authentication for calendar access
2. **Availability Management**: Complex scheduling rules with Effect
3. **Event Types**: Different meeting configurations
4. **Guest Booking**: No-auth booking flow for guests
5. **Calendar Integration**: Two-way sync with Google Calendar
6. **Email Notifications**: Configurable email templates
7. **Webhook Support**: External system integration

## Environment Variables

```env
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=xxx
DATABASE_URL=sqlite://./data/scheduler.db
JWT_SECRET=xxx
```

## Docker Deployment

Single docker-compose.yml for easy self-hosting:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=sqlite:///app/data/scheduler.db
```

## Running Effects

Always use `Effect.runPromise` or `Effect.runFork` at the application boundary:

```ts
// Main application entry point - packages/backend/index.ts
import { Effect, Layer } from "effect"
import { ConfigService } from "./src/services/ConfigService.js"
import { TelemetryService } from "./src/services/TelemetryService.js"

const program = Effect.gen(function* () {
  const config = yield* ConfigService
  
  const result = yield* Effect.gen(function* () {
    yield* Effect.annotateCurrentSpan("appName", config.getAppName())
    yield* Effect.annotateCurrentSpan("version", config.getVersion())
    yield* Effect.annotateCurrentSpan("environment", config.getEnvironment())
    
    yield* Effect.log(`Starting ${config.getAppName()} v${config.getVersion()}`)
    yield* Effect.log(`Environment: ${config.getEnvironment()}`)
    
    return "Application started successfully"
  }).pipe(
    Effect.withSpan("app-startup", {
      attributes: {
        "app.operation": "startup",
        "app.name": config.getAppName(),
        "app.version": config.getVersion(),
        "app.environment": config.getEnvironment()
      }
    })
  )
  
  return result
})

const MainLive = Layer.mergeAll(
  ConfigService.Default,
  TelemetryService.Default
)

// Get the telemetry layer and provide it to the main program
Effect.gen(function* () {
  const telemetryLayer = yield* TelemetryService
  const result = yield* program.pipe(Effect.provide(telemetryLayer))
  return result
}).pipe(
  Effect.provide(MainLive),
  Effect.catchAllCause(Effect.logError),
  Effect.runPromise
).then(console.log)
```

**Key Patterns:**

- Use `Effect.gen` for readable async flow
- Build layers with `Layer.mergeAll` and `ServiceName.Default`
- Services can yield other services and return layers directly
- Use `Effect.provide(MainLive)` to inject all services
- Always include `Effect.catchAllCause(Effect.logError)` for error handling
- Use `Effect.runPromise` at the application boundary

For more Bun-specific information, read the Bun API docs in `node_modules/bun-types/docs/**.md`.

## Backlog

Future enhancements to consider after the prototype is complete:

1. **Database Integration**:
   - Migrate from in-memory to SQLite using bun:sqlite
   - Store user preferences, booking history, and availability rules

2. **Authentication**:
   - Implement real Google OAuth 2.0 flow
   - JWT session management
   - Role-based access control

3. **Advanced Scheduling**:
   - Recurring availability patterns
   - Buffer time between meetings
   - Time zone handling
   - Working hours configuration

4. **Integration Features**:
   - Real Google Calendar API integration
   - Email service integration (SendGrid/AWS SES)
   - Webhook support for external systems
   - iCal feed generation

5. **UI Enhancements**:
   - Calendar widget for availability selection
   - Admin dashboard for managing bookings
   - Customizable booking forms
   - Email template editor

6. **Performance & Monitoring**:
   - Real telemetry with OpenTelemetry export
   - Rate limiting
   - Caching layer
   - Health check endpoints
