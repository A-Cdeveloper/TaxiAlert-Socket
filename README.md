# TaxiAlert Socket Server

Real-time notification service for the TaxiAlert platform. It accepts drive lifecycle signals from the primary backend and pushes updates to connected driver clients so map views stay in sync without polling.

---

## Overview

| Aspect            | Description                                                                |
| ----------------- | -------------------------------------------------------------------------- |
| **Role**          | Dedicated Socket.IO layer between the TaxiAlert API and driver map clients |
| **Primary event** | `drive-updated`                                                            |
| **Transport**     | Socket.IO over HTTP (WebSocket with fallback where applicable)             |
| **Runtime**       | Node.js, TypeScript, Express                                               |

The service is intentionally narrow in scope: it does not own business logic for drives; it relays authoritative state changes emitted by the backend.

---

## Responsibilities

1.  **Driver connections** — Accept authenticated Socket.IO connections from clients that display the live map.
2.  **Backend publish** — Expose a controlled HTTP endpoint (or equivalent) so the backend can signal that a drive changed.
3.  **Broadcast** — Fan out `drive-updated` to all connected clients (MVP: global broadcast).

---

## MVP scope

**In scope**

- Socket.IO server integrated with Express
- HTTP endpoint for backend-triggered publishes
- Broadcast of `drive-updated` to connected sockets
- Basic authentication for driver sockets and for the publish endpoint

**Out of scope (later)**

- Horizontal scaling via Redis adapter / pub-sub
- Fine-grained rooms (e.g. per city or region)
- Durable event log or replay

---

## Tech stack

- **Node.js** — runtime
- **TypeScript** — type-safe server code
- **Express** — HTTP surface (health, publish)
- **Socket.IO** — real-time client channel
- **dotenv** — environment configuration

---

## Repository layout

```
src/
  server.ts          # Application entry; HTTP + Socket.IO bootstrap
  socket/
    index.ts         # Socket connection and event registration
  types/
    events.ts        # Shared event and payload types
```

---

## Prerequisites

- Node.js LTS (recommended: current Active LTS)
- npm (or compatible package manager)

---

## Installation

```
npm install
```

---

## Configuration

Create a `.env` file in the project root (do not commit secrets). Minimum for local development:

```
PORT=3001
```

Variables planned for production-hardening:

| Variable             | Purpose                                                                  |
| -------------------- | ------------------------------------------------------------------------ |
| `WS_ALLOWED_ORIGINS` | CORS / Socket.IO origin allowlist (e.g. `https://app.taxialert.example`) |
| `WS_PUBLISH_SECRET`  | Shared secret for backend publish requests                               |
| `JWT_SECRET`         | Validation of driver tokens if aligned with the main API                 |

---

## Scripts

| Command         | Description                                     |
| --------------- | ----------------------------------------------- |
| `npm run dev`   | Development server with file watch (`tsx`)      |
| `npm run build` | Compile TypeScript to `dist/`                   |
| `npm start`     | Run the compiled server (`node dist/server.js`) |

---

## Event contract (MVP)

Backend and clients should treat the following shape as the canonical payload for drive refresh signals:

```
{
  "type": "drive-updated",
  "ddid": "cmxxxx...",
  "at": "2026-04-15T12:34:56.000Z"
}
```

| Field  | Requirement | Notes                                        |
| ------ | ----------- | -------------------------------------------- |
| `type` | Required    | Must be `drive-updated` for this channel     |
| `ddid` | Recommended | Drive identifier for targeted client refresh |
| `at`   | Optional    | ISO 8601 timestamp for tracing and support   |

---

## Backend integration

After successful mutations on the main API (for example: `createDrive`, `cancelDrive`, `pickupDrive`, `completeDrive`, `releaseDrivePickup`), the backend should call this service’s publish endpoint so drivers receive `drive-updated`.

**Resilience:** Real-time delivery is best-effort. If the publish call fails, the primary transaction should still succeed; log the failure and optionally retry or alert according to your operations policy.

---

## Security notes

- Restrict the publish endpoint to trusted callers (network policy, shared secret, or mutual TLS as appropriate).
- Validate driver identity on socket handshake before accepting long-lived connections.
- Keep `.env` and secrets out of version control; rotate `WS_PUBLISH_SECRET` on the same schedule as other service credentials.

---

## Operations

Recommended baseline for production readiness:

- Heartbeats and idle timeouts on connections
- Client-side reconnection with backoff
- Structured logging: connect, disconnect, publish received, broadcast count
- Simple metrics: active connections, publish rate, error rate

---

## Roadmap

- Wire `server.ts` and `socket/index.ts` with a minimal health route and socket lifecycle logging
- Centralize event types in `src/types/events.ts`
- Implement authenticated publish and driver handshake

---

## License

ISC (see `package.json`).
