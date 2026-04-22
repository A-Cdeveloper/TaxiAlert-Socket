import "dotenv/config";
import express from "express";
import http from "node:http";
import { Server } from "socket.io";

import { createDriveEventsRouter } from "./routes/index.js";
import { registerSocketHandlers } from "./socket/index.js";
import { startExpireDrivesPoller } from "./services/expireDrivesPoller.service.js";

const app = express();
const port = Number(process.env.PORT ?? "3001");
const httpServer = http.createServer(app);
const allowedOrigins = (
  process.env.WS_ALLOWED_ORIGINS ?? "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

const nextInternalBaseUrl = process.env.NEXT_INTERNAL_BASE_URL;
const nextInternalSecret = process.env.NEXT_INTERNAL_SECRET;
const expirePollIntervalMs = Number(
  process.env.EXPIRE_POLL_INTERVAL_MS ?? "10000",
);
const expireLookbackMs = Number(process.env.EXPIRE_LOOKBACK_MS ?? "15000");

if (!nextInternalBaseUrl || !nextInternalSecret) {
  throw new Error("Missing NEXT_INTERNAL_BASE_URL or NEXT_INTERNAL_SECRET");
}

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

registerSocketHandlers(io);
app.use("/events", createDriveEventsRouter(io));

startExpireDrivesPoller(io, {
  nextInternalBaseUrl,
  nextInternalSecret,
  intervalMs: expirePollIntervalMs,
  lookbackMs: expireLookbackMs,
});

httpServer.listen(port, () => {
  console.log(`HTTP listening on http://localhost:${port}`);
});
