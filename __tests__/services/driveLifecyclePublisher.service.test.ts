import type { Server } from "socket.io";
import { afterEach, describe, expect, it, vi } from "vitest";

import { publishDriveLifecycle } from "../../src/services/driveLifecyclePublisher.service.js";
import type { DriveLifecyclePayload } from "../../src/types/index.js";

function createIoMock(): {
  io: Server;
  to: ReturnType<typeof vi.fn>;
  emitToRoom: ReturnType<typeof vi.fn>;
} {
  const emitToRoom = vi.fn();
  const to = vi.fn().mockReturnValue({ emit: emitToRoom });
  const io = { to } as unknown as Server;
  return { io, to, emitToRoom };
}

describe("publishDriveLifecycle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits drive-lifecycle to client room with the same payload reference", () => {
    const { io, to, emitToRoom } = createIoMock();
    const payload: DriveLifecyclePayload = {
      clientId: "client-1",
      driveId: "drive-1",
      eventType: "drive.picked_up",
      occurredAt: "2026-04-26T12:34:56.000Z",
    };

    publishDriveLifecycle(io, payload);

    expect(to).toHaveBeenCalledTimes(1);
    expect(to).toHaveBeenCalledWith("client:client-1");
    expect(emitToRoom).toHaveBeenCalledTimes(1);
    expect(emitToRoom).toHaveBeenCalledWith("drive-lifecycle", payload);
    expect(emitToRoom.mock.calls[0]?.[1]).toBe(payload);
  });

  it("includes driver in emitted payload when present", () => {
    const { io, to, emitToRoom } = createIoMock();
    const payload: DriveLifecyclePayload = {
      clientId: "c-2",
      driveId: "d-2",
      eventType: "drive.completed",
      occurredAt: "2026-05-01T10:00:00.000Z",
      driver: {
        did: "driver-1",
        firstname: "A",
        lastname: "B",
        phone: "+381600000000",
        car: "Car",
        plateNumber: "BG1",
      },
    };

    publishDriveLifecycle(io, payload);

    expect(to).toHaveBeenCalledWith("client:c-2");
    expect(emitToRoom).toHaveBeenCalledWith("drive-lifecycle", payload);
    expect(emitToRoom.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ driver: payload.driver }),
    );
  });
});
