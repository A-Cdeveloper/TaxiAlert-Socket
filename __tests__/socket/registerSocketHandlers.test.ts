import type { Server } from "socket.io";
import { afterEach, describe, expect, it, vi } from "vitest";

import { registerSocketHandlers } from "../../src/socket/registerSocketHandlers.js";

type SocketHandler = (...args: unknown[]) => void;

function createIoWithConnectionCapture(): {
  io: Server;
  getConnectionHandler: () => (socket: MockSocket) => void;
} {
  let connectionHandler: ((socket: MockSocket) => void) | undefined;

  const io = {
    on: vi.fn((event: string, cb: (socket: MockSocket) => void) => {
      if (event === "connection") {
        connectionHandler = cb;
      }
    }),
  } as unknown as Server;

  return {
    io,
    getConnectionHandler: () => {
      if (!connectionHandler) {
        throw new Error("connection handler was not registered");
      }
      return connectionHandler;
    },
  };
}

type MockSocket = {
  id: string;
  on: ReturnType<typeof vi.fn>;
  join: ReturnType<typeof vi.fn>;
};

function createMockSocket(id = "socket-1"): {
  socket: MockSocket;
  getHandler: (event: string) => SocketHandler | undefined;
} {
  const handlers = new Map<string, SocketHandler>();
  const join = vi.fn();

  const socket: MockSocket = {
    id,
    join,
    on: vi.fn((event: string, cb: SocketHandler) => {
      handlers.set(event, cb);
    }),
  };

  return {
    socket,
    getHandler: (event) => handlers.get(event),
  };
}

describe("registerSocketHandlers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers a connection listener on io", () => {
    const { io, getConnectionHandler } = createIoWithConnectionCapture();

    registerSocketHandlers(io);

    expect(io.on).toHaveBeenCalledWith("connection", expect.any(Function));
    expect(getConnectionHandler()).toEqual(expect.any(Function));
  });

  it("joins client room when subscribe-client-room has a non-empty clientId", () => {
    const { io, getConnectionHandler } = createIoWithConnectionCapture();
    registerSocketHandlers(io);

    const { socket, getHandler } = createMockSocket();
    getConnectionHandler()(socket);

    expect(socket.on).toHaveBeenCalledWith(
      "subscribe-client-room",
      expect.any(Function),
    );
    expect(socket.on).toHaveBeenCalledTimes(1);

    getHandler("subscribe-client-room")?.({ clientId: "  client-99  " });

    expect(socket.join).toHaveBeenCalledTimes(1);
    expect(socket.join).toHaveBeenCalledWith("client:client-99");
  });

  it("does not join when clientId is missing, empty, or only whitespace", () => {
    const { io, getConnectionHandler } = createIoWithConnectionCapture();
    registerSocketHandlers(io);

    const { socket, getHandler } = createMockSocket();
    getConnectionHandler()(socket);
    const subscribe = getHandler("subscribe-client-room");
    expect(subscribe).toBeDefined();

    subscribe?.({});
    subscribe?.({ clientId: undefined });
    subscribe?.({ clientId: "" });
    subscribe?.({ clientId: "   " });
    subscribe?.({ clientId: 42 as unknown as string });

    expect(socket.join).not.toHaveBeenCalled();
  });
});
