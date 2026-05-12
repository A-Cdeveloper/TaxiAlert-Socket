import express from "express";
import request from "supertest";
import type { Server } from "socket.io";
import { describe, expect, it, vi } from "vitest";

import { configureHttpApp } from "../../src/createHttpApp.js";

describe("GET /health", () => {
  it("returns { ok: true }", async () => {
    const app = express();
    const io = { on: vi.fn() } as unknown as Server;
    configureHttpApp(app, io);

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
