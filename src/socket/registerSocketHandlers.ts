import type { Server } from "socket.io";

export function registerSocketHandlers(io: Server): void {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

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

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", socket.id, reason);
    });
  });
}
