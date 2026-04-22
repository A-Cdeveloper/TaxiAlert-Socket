import type { Server } from "socket.io";
import { publishDriveUpdated } from "./driveEventPublisher.service.js";

export type ExpirePollConfig = {
  nextInternalBaseUrl: string;
  nextInternalSecret: string;
  intervalMs: number;
  lookbackMs: number;
};

const DEDUPE_TTL_MS = 30_000;

export function startExpireDrivesPoller(
  io: Server,
  config: ExpirePollConfig,
): void {
  const lastEmittedAtByDdid = new Map<string, number>();
  let isPolling = false;

  setInterval(async () => {
    if (isPolling) {
      return;
    }

    isPolling = true;
    try {
      const url = new URL(
        "/api/cron/expire-drives",
        config.nextInternalBaseUrl,
      );
      url.searchParams.set("lookbackMs", String(config.lookbackMs));

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.nextInternalSecret}`,
        },
      });

      if (!response.ok) {
        console.error(
          "[expire-poll] request failed",
          response.status,
          response.statusText,
        );
        return;
      }

      const data = (await response.json()) as {
        ok: boolean;
        ddids: string[];
        count: number;
        serverNow: string;
      };

      if (!data.ok || !Array.isArray(data.ddids)) {
        console.error("[expire-poll] invalid response shape");
        return;
      }

      for (const ddid of data.ddids) {
        const now = Date.now();
        const lastEmittedAt = lastEmittedAtByDdid.get(ddid);

        if (lastEmittedAt && now - lastEmittedAt < DEDUPE_TTL_MS) {
          continue;
        }

        publishDriveUpdated(io, ddid);
        lastEmittedAtByDdid.set(ddid, now);
      }

      for (const [savedDdid, timestamp] of lastEmittedAtByDdid.entries()) {
        if (Date.now() - timestamp >= DEDUPE_TTL_MS) {
          lastEmittedAtByDdid.delete(savedDdid);
        }
      }

      if (data.ddids.length > 0) {
        console.log("[expire-poll] emitted drive-updated", {
          count: data.ddids.length,
        });
      }
    } catch (error) {
      console.error("[expire-poll] error", error);
    } finally {
      isPolling = false;
    }
  }, config.intervalMs);
}
