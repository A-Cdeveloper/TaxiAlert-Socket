import type { Server } from "socket.io";

/**
 * Registers socket connection lifecycle and room subscription events.
 */
export function registerSocketHandlers(io: Server): void {
  io.on("connection", (socket) => {
    socket.on(
      "subscribe-client-room",
      ({ clientId }: { clientId?: string }) => {
        const normalizedClientId =
          typeof clientId === "string" ? clientId.trim() : "";

        if (!normalizedClientId) {
          return;
        }

        socket.join(`client:${normalizedClientId}`);
      },
    );
  });
}
