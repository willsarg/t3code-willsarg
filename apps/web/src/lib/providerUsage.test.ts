import { EventId, TurnId, type OrchestrationThreadActivity } from "@t3tools/contracts";
import { describe, expect, it } from "vitest";

import {
  deriveLatestProviderUsageByProvider,
  deriveLatestProviderUsageSnapshot,
} from "./providerUsage";

function makeActivity(overrides: {
  id?: string;
  createdAt?: string;
  payload?: Record<string, unknown>;
}): OrchestrationThreadActivity {
  return {
    id: EventId.make(overrides.id ?? crypto.randomUUID()),
    createdAt: overrides.createdAt ?? "2026-04-24T00:00:00.000Z",
    kind: "account.rate-limits.updated",
    summary: "Provider rate limits updated",
    tone: "info",
    payload: overrides.payload ?? {},
    turnId: TurnId.make("turn-1"),
  };
}

describe("deriveLatestProviderUsageSnapshot", () => {
  it("merges Claude window events for the same provider", () => {
    const snapshot = deriveLatestProviderUsageSnapshot([
      makeActivity({
        createdAt: "2026-04-24T00:00:01.000Z",
        payload: {
          type: "rate_limit_event",
          rate_limit_info: {
            status: "allowed_warning",
            rateLimitType: "five_hour",
            resetsAt: 1_776_582_000,
            utilization: 0.42,
          },
        },
      }),
      makeActivity({
        createdAt: "2026-04-24T00:00:02.000Z",
        payload: {
          type: "rate_limit_event",
          rate_limit_info: {
            status: "allowed",
            rateLimitType: "seven_day",
            resetsAt: 1_776_900_000,
            utilization: 0.08,
          },
        },
      }),
    ]);

    expect(snapshot).toMatchObject({
      provider: "claudeAgent",
      providerLabel: "Claude",
      status: "warning",
      updatedAt: "2026-04-24T00:00:02.000Z",
    });
    expect(snapshot?.windows).toEqual([
      {
        label: "Weekly",
        usedPercent: 8,
        resetsAt: 1_776_900_000,
      },
      {
        label: "Session (5 hrs)",
        usedPercent: 42,
        resetsAt: 1_776_582_000,
      },
    ]);
  });
});

describe("deriveLatestProviderUsageByProvider", () => {
  it("picks the newest snapshot for each provider across threads", () => {
    const snapshots = deriveLatestProviderUsageByProvider([
      [
        makeActivity({
          createdAt: "2026-04-24T00:00:01.000Z",
          payload: {
            primary: {
              usedPercent: 17,
              windowDurationMins: 300,
              resetsAt: 1_776_580_000,
            },
            secondary: {
              usedPercent: 3,
              windowDurationMins: 10_080,
              resetsAt: 1_776_980_000,
            },
          },
        }),
      ],
      [
        makeActivity({
          createdAt: "2026-04-24T00:00:03.000Z",
          payload: {
            type: "rate_limit_event",
            rate_limit_info: {
              status: "allowed",
              rateLimitType: "five_hour",
              resetsAt: 1_776_582_000,
              utilization: 0.25,
            },
          },
        }),
      ],
      [
        makeActivity({
          createdAt: "2026-04-24T00:00:05.000Z",
          payload: {
            primary: {
              usedPercent: 29,
              windowDurationMins: 300,
              resetsAt: 1_776_590_000,
            },
          },
        }),
      ],
    ]);

    expect(snapshots.codex).toMatchObject({
      provider: "codex",
      updatedAt: "2026-04-24T00:00:05.000Z",
    });
    expect(snapshots.codex?.windows[0]).toMatchObject({
      label: "Session (5 hrs)",
      usedPercent: 29,
    });
    expect(snapshots.claudeAgent).toMatchObject({
      provider: "claudeAgent",
      updatedAt: "2026-04-24T00:00:03.000Z",
    });
  });
});
