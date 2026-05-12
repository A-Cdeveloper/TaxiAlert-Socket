import type { Request, Response } from "express";
import type { Server } from "socket.io";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createPublishDriveLifecycleController } from "../../src/controllers/driveLifecycle.controller.js";

const validBase = {
  clientId: "client-1",
  driveId: "drive-1",
  eventType: "drive.picked_up" as const,
  occurredAt: "2026-04-26T12:34:56.000Z",
};

const validDriver = {
  did: "driver-1",
  firstname: "A",
  lastname: "B",
  phone: "+381600000000",
  car: "Model",
  plateNumber: "BG123AB",
};

function createLifecycleIoMock(): {
  io: Server;
  to: ReturnType<typeof vi.fn>;
  emitToRoom: ReturnType<typeof vi.fn>;
} {
  const emitToRoom = vi.fn();
  const to = vi.fn().mockReturnValue({ emit: emitToRoom });
  const io = { to } as unknown as Server;
  return { io, to, emitToRoom };
}

function createMockReq(body: unknown): Request {
  return { body } as Request;
}

function createMockRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
}

describe("createPublishDriveLifecycleController", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("responds 400 and does not emit when body is invalid", () => {
    const { io, to, emitToRoom } = createLifecycleIoMock();
    const handler = createPublishDriveLifecycleController(io);
    const req = createMockReq({
      ...validBase,
      eventType: "drive.not_a_real_event",
    });
    const res = createMockRes();

    handler(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, error: expect.any(String) }),
    );
    expect(to).not.toHaveBeenCalled();
    expect(emitToRoom).not.toHaveBeenCalled();
  });

  it("responds 400 when required field is missing", () => {
    const { io, to, emitToRoom } = createLifecycleIoMock();
    const handler = createPublishDriveLifecycleController(io);
    const req = createMockReq({
      driveId: validBase.driveId,
      eventType: validBase.eventType,
      occurredAt: validBase.occurredAt,
    });
    const res = createMockRes();

    handler(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(to).not.toHaveBeenCalled();
    expect(emitToRoom).not.toHaveBeenCalled();
  });

  it("responds 200 and emits to client room without driver when omitted", () => {
    const { io, to, emitToRoom } = createLifecycleIoMock();
    const handler = createPublishDriveLifecycleController(io);
    const req = createMockReq({ ...validBase });
    const res = createMockRes();

    handler(req, res, vi.fn());

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(to).toHaveBeenCalledTimes(1);
    expect(to).toHaveBeenCalledWith("client:client-1");
    expect(emitToRoom).toHaveBeenCalledTimes(1);
    expect(emitToRoom).toHaveBeenCalledWith(
      "drive-lifecycle",
      expect.objectContaining({
        clientId: "client-1",
        driveId: "drive-1",
        eventType: "drive.picked_up",
        occurredAt: validBase.occurredAt,
      }),
    );
    const payload = emitToRoom.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("driver");
  });

  it("responds 200 and emits payload including driver when provided", () => {
    const { io, to, emitToRoom } = createLifecycleIoMock();
    const handler = createPublishDriveLifecycleController(io);
    const req = createMockReq({ ...validBase, driver: validDriver });
    const res = createMockRes();

    handler(req, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(to).toHaveBeenCalledWith("client:client-1");
    expect(emitToRoom).toHaveBeenCalledWith(
      "drive-lifecycle",
      expect.objectContaining({
        clientId: "client-1",
        driveId: "drive-1",
        eventType: "drive.picked_up",
        occurredAt: validBase.occurredAt,
        driver: validDriver,
      }),
    );
  });
});
