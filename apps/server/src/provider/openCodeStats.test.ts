import { describe, expect, it } from "vitest";

import { buildOpenCodeUsageSummary } from "./openCodeStats.ts";

describe("buildOpenCodeUsageSummary", () => {
  it("builds a 7-day OpenCode local stats summary", () => {
    const summary = buildOpenCodeUsageSummary({
      checkedAt: "2026-04-24T22:00:00.000Z",
      overviewRow: {
        sessions: 13,
        messages: 959,
        total_cost: 24.0953,
        input_tokens: 9_861_210,
        output_tokens: 164_902,
        cache_read_tokens: 89_283_073,
        cache_write_tokens: 0,
      },
      topModelRow: {
        provider_id: "openrouter",
        model_id: "moonshotai/kimi-k2.6",
        total_cost: 20.1001,
        message_count: 652,
      },
    });

    expect(summary).toEqual({
      source: "opencodeLocalStats",
      title: "OpenCode stats (7d)",
      checkedAt: "2026-04-24T22:00:00.000Z",
      lines: [
        "7d cost: $24.10",
        "7d activity: 959 messages across 13 sessions",
        "7d tokens: 9.9M in · 165K out · 89.3M cache read",
        "Top model: openrouter/moonshotai/kimi-k2.6 ($20.10)",
      ],
    });
  });

  it("returns undefined when there is no usage in the window", () => {
    const summary = buildOpenCodeUsageSummary({
      checkedAt: "2026-04-24T22:00:00.000Z",
      overviewRow: {
        sessions: 0,
        messages: 0,
        total_cost: 0,
        input_tokens: 0,
        output_tokens: 0,
        cache_read_tokens: 0,
        cache_write_tokens: 0,
      },
      topModelRow: undefined,
    });

    expect(summary).toBeUndefined();
  });
});
