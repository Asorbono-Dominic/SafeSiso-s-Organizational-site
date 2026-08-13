/**
 * The public metrics contract — agreed now so Phase 6 is a swap, not a rewrite.
 *
 * Separate from `metrics.ts` (which is `server-only`) so these types can be
 * imported anywhere without dragging the server guard into a client bundle.
 *
 * Expected response from the FastAPI aggregation endpoint:
 *
 *   {
 *     "status": "pre_launch" | "live",
 *     "generatedAt": "2026-10-01T09:00:00.000Z" | null,
 *     "launchDate": "2026-10-01" | null,
 *     "metrics": {
 *       "girlsReached": 512 | null,
 *       "conversationsManaged": 1840 | null,
 *       "activePartners": 11 | null
 *     }
 *   }
 *
 * `null` means "we do not have this figure", which is NOT the same as 0. A
 * pre-launch pilot has not reached zero girls; it has no figure yet. The page
 * renders those two cases differently on purpose.
 *
 * Everything here is aggregated and anonymous by construction: counts only,
 * never conversation content and never anything identifying a girl.
 */

export const METRIC_KEYS = [
  "girlsReached",
  "conversationsManaged",
  "activePartners",
] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];

export type MetricsStatus =
  /** Pilot has not launched. Show the honest empty state. */
  | "pre_launch"
  /** Real figures available. */
  | "live"
  /** The source could not be read, or returned something unusable. */
  | "unavailable";

export type MetricsSnapshot = {
  status: MetricsStatus;
  /** ISO timestamp of when the backend computed these figures. */
  generatedAt: string | null;
  /** ISO date the pilot launches, shown in the pre-launch state. */
  launchDate: string | null;
  metrics: Record<MetricKey, number | null>;
};
