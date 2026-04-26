# TaxiAlert Socket Server

Realtime Socket.IO service for TaxiAlert.  
It receives backend publish events and broadcasts normalized `drive-updated` messages to all connected clients.

## Current Features

- Express + Socket.IO running on the same HTTP server
- `GET /health` liveness endpoint
- `POST /events/drive-updated` publish endpoint
- `POST /events/drive-lifecycle` client-scoped lifecycle endpoint
- Publish auth middleware using `Authorization: Bearer <WS_PUBLISH_SECRET>`
- Typed broadcast payload contract (`DriveUpdatedPayload`)
- Zod-based request validation for publish endpoints
- CORS origin allowlist via `WS_ALLOWED_ORIGINS`
- Background polling to Next internal expire endpoint (`/api/cron/expire-drives`)
- Poll dedupe (TTL) and overlap guard to prevent duplicate emits and parallel polls
- Route/controller/service split for clearer backend architecture

## Tech Stack

- Node.js
- TypeScript
- Express
- Socket.IO
- dotenv

## Project Structure

```text
src/
  server.ts
  controllers/
    driveEvents.controller.ts
    driveLifecycle.controller.ts
  middleware/
    requirePublishAuth.ts
  routes/
    driveEvents.router.ts
    index.ts
  services/
    driveEventPublisher.service.ts
    driveLifecyclePublisher.service.ts
    expireDrivesPoller.service.ts
  socket/
    registerSocketHandlers.ts
    index.ts
  types/
    driveEvents.ts
    driveLifecycle.ts
    index.ts
  schemas/
    driveEvents.schema.ts
    driveLifecycle.schema.ts
```

## Setup

### 1) Install

```bash
npm install
```

### 2) Environment

Create `.env` in project root:

```env
PORT=3001
WS_PUBLISH_SECRET=change_this_secret
WS_ALLOWED_ORIGINS=http://localhost:3000
NEXT_INTERNAL_BASE_URL=http://localhost:3000
NEXT_INTERNAL_SECRET=change_this_internal_secret
EXPIRE_POLL_INTERVAL_MS=10000
EXPIRE_LOOKBACK_MS=15000
```

For multiple allowed origins:

```env
WS_ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com
```

### 3) Run

```bash
npm run dev
```

### 4) Build / Start

```bash
npm run build
npm start
```

## Available Scripts

- `npm run dev` - run dev server with `tsx watch`
- `npm run build` - compile TypeScript to `dist`
- `npm start` - run compiled server from `dist/server.js`

## API

### `GET /health`

Response:

```json
{ "ok": true }
```

### `POST /events/drive-updated`

Headers:

- `Authorization: Bearer <WS_PUBLISH_SECRET>`
- `Content-Type: application/json`

Request body:

```json
{ "ddid": "drive-123" }
```

Validation:

- returns `400` when `ddid` is missing/invalid
- returns `401` when auth token is invalid
- returns `500` when `WS_PUBLISH_SECRET` is not configured

Broadcast payload emitted to clients:

```json
{
  "type": "drive-updated",
  "ddid": "drive-123",
  "at": "2026-04-21T12:34:56.000Z"
}
```

### `POST /events/drive-lifecycle`

Headers:

- `Authorization: Bearer <WS_PUBLISH_SECRET>`
- `Content-Type: application/json`

Request body:

```json
{
  "clientId": "uuid-string",
  "driveId": "drive-ddid-string",
  "eventType": "drive.picked_up",
  "occurredAt": "2026-04-26T12:34:56.000Z",
  "driver": {
    "did": "drv_1",
    "firstname": "Marko",
    "lastname": "Jovanovic",
    "phone": "+381601234567",
    "car": "Skoda Octavia 2.0 TDI",
    "plateNumber": "BG-123-AA"
  }
}
```

Allowed `eventType` values:

- `drive.picked_up`
- `drive.released`
- `drive.completed`

`driver` field rules:

- optional for all lifecycle events
- when provided, all driver fields are required and validated as non-empty strings

Validation:

- returns `400` for invalid payload fields (`clientId`, `driveId`, `eventType`, `occurredAt`)
- returns `401` when auth token is invalid
- returns `500` when `WS_PUBLISH_SECRET` is not configured

Socket behavior:

- room target: `client:${clientId}`
- event name: `drive-lifecycle`
- payload: same as request body

## Architecture Flow

`server.ts` keeps only application wiring:

- create Express app + HTTP server + Socket.IO
- register middleware and health endpoint
- register socket lifecycle handlers
- mount drive event routes under `/events`

Drive publish handling uses Option 1 layering:

- **Router** (`src/routes/driveEvents.router.ts`)  
  Defines endpoint and middleware chain.
- **Controller** (`src/controllers/driveEvents.controller.ts`)  
  Validates request input and orchestrates action.
- **Service** (`src/services/driveEventPublisher.service.ts`)  
  Builds typed payload and emits `drive-updated`.

Lifecycle publish flow:

- **Controller** (`src/controllers/driveLifecycle.controller.ts`)
- **Service** (`src/services/driveLifecyclePublisher.service.ts`)
- Emits `drive-lifecycle` only to `client:${clientId}` room
- Uses Zod schema validation before publishing

Expire polling flow:

- **Poller Service** (`src/services/expireDrivesPoller.service.ts`)
- Calls `GET /api/cron/expire-drives` on Next backend with internal auth
- Emits `drive-updated` for returned `ddids`
- Uses dedupe TTL and overlap guard for stable behavior

## Local Test Example

```bash
curl -X POST http://localhost:3001/events/drive-updated \
  -H "Authorization: Bearer change_this_secret" \
  -H "Content-Type: application/json" \
  -d "{\"ddid\":\"drive-123\"}"
```

```bash
curl -X POST http://localhost:3001/events/drive-lifecycle \
  -H "Authorization: Bearer change_this_secret" \
  -H "Content-Type: application/json" \
  -d "{\"clientId\":\"client-123\",\"driveId\":\"drive-123\",\"eventType\":\"drive.picked_up\",\"occurredAt\":\"2026-04-26T12:34:56.000Z\"}"
```

Client-side room subscription example:

```ts
socket.emit("subscribe-client-room", { clientId: "client-123" });
```

## Notes

- Keep `.env` out of version control
- Rotate `WS_PUBLISH_SECRET` regularly
- This service is intentionally focused on realtime event fan-out, not business logic ownership

## License

ISC
