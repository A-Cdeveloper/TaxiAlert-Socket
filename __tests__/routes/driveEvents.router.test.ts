import express, { type Express } from "express";
import request from "supertest";
import type { Server } from "socket.io";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDriveEventsRouter } from "../../src/routes/driveEvents.router.js";

const TEST_SECRET = "test-publish-secret";

const lifecycleBody = {
  clientId: "client-1",
  driveId: "drive-1",
  eventType: "drive.picked_up" as const,
  occurredAt: "2026-04-26T12:34:56.000Z",
};

function createIoMock(): {
  io: Server;
  emit: ReturnType<typeof vi.fn>;
  to: ReturnType<typeof vi.fn>;
  emitToRoom: ReturnType<typeof vi.fn>;
} {
  const emitToRoom = vi.fn();
  const to = vi.fn().mockReturnValue({ emit: emitToRoom });
  const emit = vi.fn();
  const io = { emit, to } as unknown as Server;
  return { io, emit, to, emitToRoom };
}

describe("createDriveEventsRouter", () => {
  let app: Express;
  let ioMocks: ReturnType<typeof createIoMock>;

  beforeEach(() => {
    vi.stubEnv("WS_PUBLISH_SECRET", TEST_SECRET);
    ioMocks = createIoMock();

    app = express();
    app.use(express.json());
    app.use("/events", createDriveEventsRouter(ioMocks.io));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("POST /events/drive-updated", () => {
    it("returns 401 without Bearer token", async () => {
      const res = await request(app)
        .post("/events/drive-updated")
        .set("Content-Type", "application/json")
        .send({ ddid: "drive-1" });

      expect(res.status).toBe(401);
      expect(ioMocks.emit).not.toHaveBeenCalled();
    });

    it("returns 400 with valid auth but invalid body", async () => {
      const res = await request(app)
        .post("/events/drive-updated")
        .set("Authorization", `Bearer ${TEST_SECRET}`)
        .set("Content-Type", "application/json")
        .send({ ddid: "" });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ ok: false });
      expect(ioMocks.emit).not.toHaveBeenCalled();
    });

    it("returns 200 and emits drive-updated with valid auth and body", async () => {
      const res = await request(app)
        .post("/events/drive-updated")
        .set("Authorization", `Bearer ${TEST_SECRET}`)
        .set("Content-Type", "application/json")
        .send({ ddid: "drive-123" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
      expect(ioMocks.emit).toHaveBeenCalledTimes(1);
      expect(ioMocks.emit).toHaveBeenCalledWith(
        "drive-updated",
        expect.objectContaining({
          type: "drive-updated",
          ddid: "drive-123",
          at: expect.any(String),
        }),
      );
    });
  });

  describe("POST /events/drive-lifecycle", () => {
    it("returns 401 without Bearer token", async () => {
      const res = await request(app)
        .post("/events/drive-lifecycle")
        .set("Content-Type", "application/json")
        .send(lifecycleBody);

      expect(res.status).toBe(401);
      expect(ioMocks.to).not.toHaveBeenCalled();
    });

    it("returns 400 with valid auth but invalid body", async () => {
      const res = await request(app)
        .post("/events/drive-lifecycle")
        .set("Authorization", `Bearer ${TEST_SECRET}`)
        .set("Content-Type", "application/json")
        .send({ ...lifecycleBody, eventType: "invalid.event" });

      expect(res.status).toBe(400);
      expect(ioMocks.to).not.toHaveBeenCalled();
    });

    it("returns 200 and emits to client room with valid auth and body", async () => {
      const res = await request(app)
        .post("/events/drive-lifecycle")
        .set("Authorization", `Bearer ${TEST_SECRET}`)
        .set("Content-Type", "application/json")
        .send(lifecycleBody);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
      expect(ioMocks.to).toHaveBeenCalledWith("client:client-1");
      expect(ioMocks.emitToRoom).toHaveBeenCalledWith(
        "drive-lifecycle",
        expect.objectContaining({
          clientId: "client-1",
          driveId: "drive-1",
          eventType: "drive.picked_up",
          occurredAt: lifecycleBody.occurredAt,
        }),
      );
    });
  });
});
