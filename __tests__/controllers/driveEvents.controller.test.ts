import type { Request, Response } from "express";
import type { Server } from "socket.io";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createPublishDriveUpdatedController } from "../../src/controllers/driveEvents.controller.js";

function createMockIo(): Server {
  return { emit: vi.fn() } as unknown as Server;
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

describe("createPublishDriveUpdatedController", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("responds 400 and does not emit when body is invalid", () => {
    const io = createMockIo();
    const handler = createPublishDriveUpdatedController(io);
    const req = createMockReq({ ddid: "" });
    const res = createMockRes();

    handler(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: "Drive ID is required",
    });
    expect(io.emit).not.toHaveBeenCalled();
  });

  it("responds 400 when ddid is missing", () => {
    const io = createMockIo();
    const handler = createPublishDriveUpdatedController(io);
    const req = createMockReq({});
    const res = createMockRes();

    handler(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, error: expect.any(String) }),
    );
    expect(io.emit).not.toHaveBeenCalled();
  });

  it("responds 200 and emits drive-updated when body is valid", () => {
    const io = createMockIo();
    const handler = createPublishDriveUpdatedController(io);
    const req = createMockReq({ ddid: "drive-123" });
    const res = createMockRes();

    handler(req, res, vi.fn());

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(io.emit).toHaveBeenCalledTimes(1);
    expect(io.emit).toHaveBeenCalledWith(
      "drive-updated",
      expect.objectContaining({
        type: "drive-updated",
        ddid: "drive-123",
        at: expect.any(String),
      }),
    );
  });
});
