import "dotenv/config";
import express from "express";
import http from "node:http";
import { Server } from "socket.io";

import type { DriveUpdatedPayload } from "./types/driveEvents.js";
import { requirePublishAuth } from "./middleware/requirePublishAuth.js";

const app = express();
const port = Number(process.env.PORT ?? "3001");
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// Middleware
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Socket lifecycle
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", socket.id, reason);
  });
});

// Publish endpoint (backend -> all connected clients)
app.post("/events/drive-updated", requirePublishAuth, (req, res) => {
  const ddid = typeof req.body?.ddid === "string" ? req.body.ddid : undefined;

  if (!ddid) {
    res.status(400).json({ ok: false, error: "Drive ID is required" });
    return;
  }

  const payload: DriveUpdatedPayload = {
    type: "drive-updated",
    ddid,
    at: new Date().toISOString(),
  };

  io.emit("drive-updated", payload);

  res.json({ ok: true });
});

// Start server
httpServer.listen(port, () => {
  console.log(`HTTP listening on http://localhost:${port}`);
});
