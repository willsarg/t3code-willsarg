import { describe, expect, it } from "vitest";

import type { OpenCodeInventory } from "./opencodeRuntime.ts";
import { resolveOpenCodeManagedUsageLimits } from "./openCodeUsageLimits.ts";

describe("resolveOpenCodeManagedUsageLimits", () => {
  it("extracts managed provider usage from OpenCode inventory metadata", () => {
    const inventory = {
      providerList: {
        connected: ["opencode-go", "openai"],
        all: [
          {
            id: "opencode-go",
            name: "OpenCode Go",
            models: {},
            usage: {
              used: 21,
              limit: 100,
              resetsAt: "2026-04-25T12:00:00.000Z",
            },
          },
          {
            id: "openai",
            name: "OpenAI",
            models: {},
          },
        ],
      },
      agents: [],
    } as unknown as OpenCodeInventory;

    expect(
      resolveOpenCodeManagedUsageLimits({
        checkedAt: "2026-04-24T12:00:00.000Z",
        inventory,
      }),
    ).toEqual({
      source: "opencodeManaged",
      available: true,
      checkedAt: "2026-04-24T12:00:00.000Z",
      windows: [
        {
          kind: "session",
          label: "OpenCode Go",
          usedPercent: 21,
          resetsAt: "2026-04-25T12:00:00.000Z",
        },
      ],
    });
  });
});
