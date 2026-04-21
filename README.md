# TaxiAlert Socket Server

Realtime Socket.IO service for TaxiAlert.  
It receives backend publish events and broadcasts normalized `drive-updated` messages to all connected clients.

## Current Features

- Express + Socket.IO running on the same HTTP server
- `GET /health` liveness endpoint
- `POST /events/drive-updated` publish endpoint
- Publish auth middleware using `Authorization: Bearer <WS_PUBLISH_SECRET>`
- Typed broadcast payload contract (`DriveUpdatedPayload`)
- CORS origin allowlist via `WS_ALLOWED_ORIGINS`

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
  middleware/
    requirePublishAuth.ts
  types/
    driveEvents.ts
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

## Local Test Example

```bash
curl -X POST http://localhost:3001/events/drive-updated \
  -H "Authorization: Bearer change_this_secret" \
  -H "Content-Type: application/json" \
  -d "{\"ddid\":\"drive-123\"}"
```

## Notes

- Keep `.env` out of version control
- Rotate `WS_PUBLISH_SECRET` regularly
- This service is intentionally focused on realtime event fan-out, not business logic ownership

## License

ISC
