import express, { type Express } from "express";
import type { Server } from "socket.io";

import { createDriveEventsRouter } from "./routes/index.js";
import { registerSocketHandlers } from "./socket/index.js";

/**
 * Registers HTTP routes and Socket.IO handlers on an existing Express app.
 * Used by `server.ts` at runtime and by tests without starting a listener.
 */
export function configureHttpApp(app: Express, io: Server): void {
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  registerSocketHandlers(io);
  app.use("/events", createDriveEventsRouter(io));
}
