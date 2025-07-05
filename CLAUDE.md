---

# Scheduler - Self-Hosted Calendly Alternative

This is a self-hosted scheduling application built with Bun, Effect-TS, and React. Follow these guidelines when working on this codebase.

## Core Technologies

- **Runtime**: Bun (NOT Node.js)
- **Backend**: Effect-TS with effect/platform for HTTP APIs
- **Frontend**: React + TypeScript served via Bun
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

### 🚧 In Progress: HTTP API & Mock Services

**Goal**: Build type-safe HTTP API with mocked Google Calendar and Email services.

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

- **GoogleCalendarService**: Mock service for calendar operations (list events, create events, check availability)
- **EmailService**: Mock service for sending email notifications (console.log in prototype)
- **HttpApiService**: Type-safe API definitions using HttpApi, HttpApiGroup, and HttpApiEndpoint
- **Handlers**: Separate handlers directory (`src/handlers/`) for clean separation of concerns

### 🎯 Next Steps

1. **Create GoogleCalendarService** - Mock implementation for calendar operations:

   ```ts
   export class GoogleCalendarService extends Effect.Service<GoogleCalendarService>()(
     "app/GoogleCalendarService",
     {
       succeed: {
         checkAvailability: (start: Date, end: Date) => Effect.succeed(true),
         createEvent: (event: CalendarEvent) => Effect.succeed({ id: "mock-123", ...event }),
         listEvents: (date: Date) => Effect.succeed([])
       }
     }
   ) {}
   ```

2. **Create EmailService** - Mock implementation for email notifications:

   ```ts
   export class EmailService extends Effect.Service<EmailService>()(
     "app/EmailService",
     {
       succeed: {
         sendBookingConfirmation: (to: string, event: CalendarEvent) => 
           Effect.log(`Email sent to ${to}: Booking confirmed for ${event.title}`)
       }
     }
   ) {}
   ```

3. **Create HttpApiService** - Define type-safe API endpoints:

   ```ts
   export const api = HttpApi.empty.pipe(
     HttpApi.addGroup(
       HttpApiGroup.make("availability").pipe(
         HttpApiGroup.add(HttpApiEndpoint.get("check", "/availability/:date"))
       ),
       HttpApiGroup.make("booking").pipe(
         HttpApiGroup.add(HttpApiEndpoint.post("create", "/booking"))
       )
     )
   )
   ```

4. **Create Handlers** - Implement API handlers in `src/handlers/`:
   - `AvailabilityHandlers.ts` - Check calendar availability
   - `BookingHandlers.ts` - Create bookings and send notifications

**Current Focus**: Building the mock service layer and HTTP API to enable frontend development.

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

### Phase 1: Mock Implementation

- **Environment Variables**: Use fake/hardcoded values
- **Database**: Use localStorage or in-memory stores
- **Google Calendar**: Mock API responses
- **Email**: Use console.log or toast notifications
- **Telemetry**: Use Effect's Console telemetry provider
- **Authentication**: Mock OAuth flow with fake tokens

### Why Prototype First?

1. Validate the complete service layer chain works end-to-end
2. Test business logic without external dependencies
3. Rapid iteration on API design and user flows
4. Easy to demonstrate and test locally

### Mock Service Example

```ts
// Mock implementation for prototyping
export const GoogleCalendarServiceMock = Layer.succeed(
  GoogleCalendarService,
  {
    listEvents: () => Effect.succeed([
      { id: "mock-1", title: "Team Meeting", start: new Date() },
      { id: "mock-2", title: "1:1 with Manager", start: new Date() }
    ]),
    createEvent: (event) => Effect.gen(function* () {
      yield* Effect.log(`Would create event: ${event.title}`)
      return { id: `mock-${Date.now()}`, ...event }
    })
  }
)

// Switch to live implementation later
export const GoogleCalendarServiceLive = Layer.effect(
  GoogleCalendarService,
  Effect.gen(function* () {
    const config = yield* Config
    // Real implementation here
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
│   │   │   ├── services/  # Effect service layers
│   │   │   ├── tests/     # Service tests
│   │   │   ├── api/       # HTTP API definitions
│   │   │   └── schemas/   # Shared schemas
│   │   ├── index.ts       # Entry point
│   │   └── package.json
│   ├── frontend/          # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   └── app.tsx
│   │   └── package.json
│   └── shared/            # Shared types and schemas
│       └── src/
├── biome.json             # Linter configuration
├── package.json           # Root workspace config
└── docker-compose.yml
```

## Workspace Scripts

**Root level scripts** (delegate to packages via `--filter`):

- `bun dev` → `bun run --filter backend dev`
- `bun test` → `bun run --filter backend test`
- `bun test:coverage` → `bun run --filter backend test:coverage`
- `bun check` → `bun run --filter backend check`
- `bun typecheck` → `bun run --filter backend typecheck`

## Frontend with Bun

For the prototype, use Bun's built-in server with HTML imports:

```ts
// packages/frontend/src/server.ts
import { Bun } from "bun"

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url)
    
    // Serve static files
    if (url.pathname === "/") {
      return new Response(Bun.file("./index.html"))
    }
    
    // Proxy API requests to backend
    if (url.pathname.startsWith("/api")) {
      // In prototype, return mock data
      return Response.json({ mock: true })
    }
    
    return new Response("Not Found", { status: 404 })
  }
})
```

```html
<!-- packages/frontend/index.html -->
<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/app.tsx"></script>
  </body>
</html>
```

## Testing

### Structure

- Tests are located in `src/tests/` directory
- One test file per service: `ServiceName.test.ts`
- Use prototype layers for testing (no separate test layers)

### Patterns

#### Basic Service Test

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

#### Error Testing with Effect.flip

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

### Rules

1. **Use Effect.flip for error testing** (NOT Effect.either)
2. **Tests use prototype layers directly** (ServiceName.Default)
3. **Use ParseResult.isParseError(result)** for schema validation errors
4. **Maintain >80% code coverage**
5. **One test file per service**

### Scripts

- `bun test` - Run all tests
- `bun test:watch` - Run tests in watch mode  
- `bun test:coverage` - Run tests with coverage report

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
