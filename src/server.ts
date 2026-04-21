import "dotenv/config";
import express from "express";
import http from "node:http";
import { Server } from "socket.io";

// Create the Express application instance.
const app = express();

// Resolve application port (fallback to 3001 for local development).
const port = Number(process.env.PORT ?? "3001");

// Basic health-check endpoint to verify server is alive.
app.get("/health", (_req, res) => {
  // Return a minimal JSON response.
  res.json({ ok: true });
});

// Create a real HTTP server and attach the Express app to it.
const httpServer = http.createServer(app);

// Initialize Socket.IO on top of the same HTTP server.
const io = new Server(httpServer, {
  // Allow all origins for now (dev-friendly, tighten later for production).
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", socket.id, reason);
  });
});

// Start listening for incoming HTTP and Socket.IO connections.
httpServer.listen(port, () => {
  // Print server URL once startup succeeds.
  console.log(`HTTP listening on http://localhost:${port}`);
});
