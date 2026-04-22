import "dotenv/config";
import express from "express";
import http from "node:http";
import { Server } from "socket.io";

import { createDriveEventsRouter } from "./routes/index.js";
import { registerSocketHandlers } from "./socket/index.js";

const app = express();
const port = Number(process.env.PORT ?? "3001");
const httpServer = http.createServer(app);
const allowedOrigins = (process.env.WS_ALLOWED_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

registerSocketHandlers(io);
app.use("/events", createDriveEventsRouter(io));

httpServer.listen(port, () => {
  console.log(`HTTP listening on http://localhost:${port}`);
});
