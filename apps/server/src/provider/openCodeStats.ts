import { copyFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type { ServerProviderUsageSummary } from "@t3tools/contracts";
import { Effect } from "effect";

const OPENCODE_STATS_WINDOW_DAYS = 7;

interface OpenCodeQueryCommandResult {
  readonly stdout: string;
  readonly code: number;
}

interface OpenCodeStatsOverviewRow {
  readonly sessions?: number | null;
  readonly messages?: number | null;
  readonly total_cost?: number | null;
  readonly input_tokens?: number | null;
  readonly output_tokens?: number | null;
  readonly cache_read_tokens?: number | null;
  readonly cache_write_tokens?: number | null;
}

interface OpenCodeStatsTopModelRow {
  readonly provider_id?: string | null;
  readonly model_id?: string | null;
  readonly total_cost?: number | null;
  readonly message_count?: number | null;
}

function readFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value);
}

function resolveOpenCodeDataHome(): string {
  const configured = process.env.XDG_DATA_HOME?.trim();
  if (configured) {
    return configured;
  }
  return join(homedir(), ".local", "share");
}

export function resolveOpenCodeStatsDbPath(): string {
  return join(resolveOpenCodeDataHome(), "opencode", "opencode.db");
}

function makeSqliteReadOnlyUri(dbPath: string): string {
  const url = pathToFileURL(dbPath);
  url.searchParams.set("mode", "ro");
  return url.toString();
}

function parseJsonRows<T>(stdout: string): ReadonlyArray<T> | undefined {
  const trimmed = stdout.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = JSON.parse(trimmed);
  return Array.isArray(parsed) ? (parsed as ReadonlyArray<T>) : undefined;
}

function createDatabaseSnapshot(dbPath: string): { readonly snapshotDb: string; readonly tmpRoot: string } {
  const tmpRoot = mkdtempSync(join(tmpdir(), "t3-opencode-stats-"));
  const snapshotDb = join(tmpRoot, "opencode.db");

  copyFileSync(dbPath, snapshotDb);

  for (const suffix of ["-wal", "-shm"] as const) {
    const source = `${dbPath}${suffix}`;
    const destination = `${snapshotDb}${suffix}`;
    if (existsSync(source)) {
      copyFileSync(source, destination);
    }
  }

  return { snapshotDb, tmpRoot };
}

function removeDatabaseSnapshot(tmpRoot: string): void {
  rmSync(tmpRoot, { recursive: true, force: true });
}

const STATS_OVERVIEW_SQL = `
  SELECT
    COUNT(DISTINCT session_id) AS sessions,
    COUNT(*) AS messages,
    ROUND(SUM(COALESCE(json_extract(data, '$.cost'), 0)), 4) AS total_cost,
    SUM(COALESCE(json_extract(data, '$.tokens.input'), 0)) AS input_tokens,
    SUM(COALESCE(json_extract(data, '$.tokens.output'), 0)) AS output_tokens,
    SUM(COALESCE(json_extract(data, '$.tokens.cache.read'), 0)) AS cache_read_tokens,
    SUM(COALESCE(json_extract(data, '$.tokens.cache.write'), 0)) AS cache_write_tokens
  FROM message
  WHERE json_extract(data, '$.role') = 'assistant'
    AND time_created >= (strftime('%s', 'now', '-${OPENCODE_STATS_WINDOW_DAYS} days') * 1000);
`;

const STATS_TOP_MODEL_SQL = `
  SELECT
    json_extract(data, '$.providerID') AS provider_id,
    json_extract(data, '$.modelID') AS model_id,
    ROUND(SUM(COALESCE(json_extract(data, '$.cost'), 0)), 4) AS total_cost,
    COUNT(*) AS message_count
  FROM message
  WHERE json_extract(data, '$.role') = 'assistant'
    AND time_created >= (strftime('%s', 'now', '-${OPENCODE_STATS_WINDOW_DAYS} days') * 1000)
  GROUP BY 1, 2
  ORDER BY total_cost DESC, message_count DESC
  LIMIT 1;
`;

function buildModelLabel(row: OpenCodeStatsTopModelRow | undefined): string | undefined {
  if (!row) {
    return undefined;
  }
  const providerId = readNonEmptyString(row.provider_id);
  const modelId = readNonEmptyString(row.model_id);
  if (!providerId || !modelId) {
    return undefined;
  }
  return modelId.startsWith(`${providerId}/`) ? modelId : `${providerId}/${modelId}`;
}

export function buildOpenCodeUsageSummary(input: {
  readonly checkedAt: string;
  readonly overviewRow: OpenCodeStatsOverviewRow | undefined;
  readonly topModelRow: OpenCodeStatsTopModelRow | undefined;
}): ServerProviderUsageSummary | undefined {
  const messages = readFiniteNumber(input.overviewRow?.messages) ?? 0;
  if (messages <= 0) {
    return undefined;
  }

  const sessions = readFiniteNumber(input.overviewRow?.sessions) ?? 0;
  const totalCost = readFiniteNumber(input.overviewRow?.total_cost) ?? 0;
  const inputTokens = readFiniteNumber(input.overviewRow?.input_tokens) ?? 0;
  const outputTokens = readFiniteNumber(input.overviewRow?.output_tokens) ?? 0;
  const cacheReadTokens = readFiniteNumber(input.overviewRow?.cache_read_tokens) ?? 0;
  const cacheWriteTokens = readFiniteNumber(input.overviewRow?.cache_write_tokens) ?? 0;
  const topModel = buildModelLabel(input.topModelRow);
  const topModelCost = readFiniteNumber(input.topModelRow?.total_cost);

  const tokenParts = [
    `${formatCompactNumber(inputTokens)} in`,
    `${formatCompactNumber(outputTokens)} out`,
    `${formatCompactNumber(cacheReadTokens)} cache read`,
    ...(cacheWriteTokens > 0 ? [`${formatCompactNumber(cacheWriteTokens)} cache write`] : []),
  ];

  const lines = [
    `${OPENCODE_STATS_WINDOW_DAYS}d cost: ${formatUsd(totalCost)}`,
    `${OPENCODE_STATS_WINDOW_DAYS}d activity: ${formatCompactNumber(messages)} messages across ${formatCompactNumber(sessions)} sessions`,
    `${OPENCODE_STATS_WINDOW_DAYS}d tokens: ${tokenParts.join(" · ")}`,
    ...(topModel && typeof topModelCost === "number"
      ? [`Top model: ${topModel} (${formatUsd(topModelCost)})`]
      : []),
  ];

  return {
    source: "opencodeLocalStats",
    title: `OpenCode stats (${OPENCODE_STATS_WINDOW_DAYS}d)`,
    checkedAt: input.checkedAt,
    lines,
  };
}

export const loadOpenCodeUsageSummary = (input: {
  readonly checkedAt: string;
  readonly runSqliteCommand: (
    args: ReadonlyArray<string>,
  ) => Effect.Effect<OpenCodeQueryCommandResult, never>;
}) =>
  Effect.sync(() => {
    try {
      const dbPath = resolveOpenCodeStatsDbPath();
      if (!existsSync(dbPath)) {
        return undefined;
      }

      return createDatabaseSnapshot(dbPath);
    } catch {
      return undefined;
    }
  }).pipe(
    Effect.flatMap((snapshot) => {
      if (!snapshot) {
        return Effect.succeed(undefined);
      }

      const dbUri = makeSqliteReadOnlyUri(snapshot.snapshotDb);

      const runQuery = <TRow>(sql: string) =>
        input.runSqliteCommand(["-json", dbUri, sql]).pipe(
          Effect.map((result) => {
            if (result.code !== 0) {
              return undefined;
            }
            return parseJsonRows<TRow>(result.stdout);
          }),
          Effect.orElseSucceed(() => undefined),
        );

      return Effect.all(
        {
          overviewRows: runQuery<OpenCodeStatsOverviewRow>(STATS_OVERVIEW_SQL),
          topModelRows: runQuery<OpenCodeStatsTopModelRow>(STATS_TOP_MODEL_SQL),
        },
        { concurrency: "unbounded" },
      ).pipe(
        Effect.map(({ overviewRows, topModelRows }) =>
          buildOpenCodeUsageSummary({
            checkedAt: input.checkedAt,
            overviewRow: overviewRows?.[0],
            topModelRow: topModelRows?.[0],
          }),
        ),
        Effect.ensuring(Effect.sync(() => removeDatabaseSnapshot(snapshot.tmpRoot))),
      );
    }),
  );
