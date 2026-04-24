import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { ServerProvider } from "./server.ts";

const decodeServerProvider = Schema.decodeUnknownSync(ServerProvider);

describe("ServerProvider", () => {
  it("defaults capability arrays when decoding legacy snapshots", () => {
    const parsed = decodeServerProvider({
      provider: "codex",
      enabled: true,
      installed: true,
      version: "1.0.0",
      status: "ready",
      auth: {
        status: "authenticated",
      },
      checkedAt: "2026-04-10T00:00:00.000Z",
      models: [],
    });

    expect(parsed.slashCommands).toEqual([]);
    expect(parsed.skills).toEqual([]);
  });

  it("decodes optional provider usage limits", () => {
    const parsed = decodeServerProvider({
      provider: "opencode",
      displayName: "OpenCode",
      enabled: true,
      installed: true,
      version: "1.14.24",
      status: "ready",
      auth: {
        status: "authenticated",
        type: "opencode",
      },
      checkedAt: "2026-04-24T00:00:00.000Z",
      models: [],
      usageLimits: {
        source: "opencodeManaged",
        available: true,
        checkedAt: "2026-04-24T00:00:00.000Z",
        windows: [
          {
            kind: "session",
            label: "OpenCode Go",
            usedPercent: 42,
            resetsAt: "2026-04-25T00:00:00.000Z",
            windowDurationMins: 1440,
          },
        ],
      },
    });

    expect(parsed.usageLimits?.available).toBe(true);
    expect(parsed.usageLimits?.windows).toHaveLength(1);
  });
});
