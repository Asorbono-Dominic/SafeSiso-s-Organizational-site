import "server-only";

import fixture from "@/content/fixtures/metrics.json";
import type { MetricsSnapshot, MetricKey } from "./metrics-types";
import { METRIC_KEYS } from "./metrics-types";

/**
 * THE SWAP POINT for public impact figures.
 *
 * Right now this returns the fixture in `content/fixtures/metrics.json`. When
 * the FastAPI aggregation endpoint exists (Phase 6), set SAFESISO_API_BASE_URL
 * and this reads from it instead — nothing else in the codebase changes,
 * because nothing else knows where the numbers come from.
 *
 * The browser NEVER calls the backend directly (Spec 8.2). This module runs
 * only on the server, and the public surface is the /api/metrics Route Handler,
 * which keeps the backend's URL and response shape off the public internet and
 * gives one place to reshape or redact before anything reaches a visitor.
 */

/** How long a metrics read is considered fresh, in seconds. */
export const METRICS_REVALIDATE_SECONDS = 300;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Coerce anything into a snapshot we are willing to publish.
 *
 * Deliberately strict: an unrecognised payload becomes `unavailable` rather
 * than being rendered optimistically. This page faces funders, so showing a
 * confidently wrong number is worse than showing none.
 */
export function normalizeSnapshot(payload: unknown): MetricsSnapshot {
  if (!payload || typeof payload !== "object") {
    return emptySnapshot("unavailable");
  }

  const raw = payload as Record<string, unknown>;
  const status =
    raw.status === "live" || raw.status === "pre_launch"
      ? raw.status
      : "unavailable";

  const rawMetrics =
    raw.metrics && typeof raw.metrics === "object"
      ? (raw.metrics as Record<string, unknown>)
      : {};

  const metrics = Object.fromEntries(
    METRIC_KEYS.map((key) => [
      key,
      isFiniteNumber(rawMetrics[key]) ? rawMetrics[key] : null,
    ]),
  ) as Record<MetricKey, number | null>;

  // "live" with nothing to show is not live — treat it as unavailable rather
  // than rendering a row of blanks under a confident heading.
  const hasAnyValue = METRIC_KEYS.some((key) => metrics[key] !== null);
  const resolvedStatus =
    status === "live" && !hasAnyValue ? "unavailable" : status;

  return {
    status: resolvedStatus,
    generatedAt: typeof raw.generatedAt === "string" ? raw.generatedAt : null,
    launchDate: typeof raw.launchDate === "string" ? raw.launchDate : null,
    metrics,
  };
}

function emptySnapshot(status: MetricsSnapshot["status"]): MetricsSnapshot {
  return {
    status,
    generatedAt: null,
    launchDate: null,
    metrics: Object.fromEntries(
      METRIC_KEYS.map((key) => [key, null]),
    ) as Record<MetricKey, number | null>,
  };
}

export async function getMetrics(): Promise<MetricsSnapshot> {
  const baseUrl = process.env.SAFESISO_API_BASE_URL;

  if (!baseUrl) {
    // Phase 3: no backend yet. The fixture is the source of truth.
    return normalizeSnapshot(fixture);
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/metrics`, {
      headers: process.env.SAFESISO_API_KEY
        ? { Authorization: `Bearer ${process.env.SAFESISO_API_KEY}` }
        : undefined,
      next: { revalidate: METRICS_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      console.error(`[metrics] Backend responded ${response.status}.`);
      return emptySnapshot("unavailable");
    }

    return normalizeSnapshot(await response.json());
  } catch (error) {
    console.error("[metrics] Read failed.", error);
    return emptySnapshot("unavailable");
  }
}
