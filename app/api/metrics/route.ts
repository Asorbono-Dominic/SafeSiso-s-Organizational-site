import { NextResponse } from "next/server";
import { getMetrics, METRICS_REVALIDATE_SECONDS } from "@/lib/metrics";

/**
 * Public metrics endpoint — the thin server-side proxy from Spec 8.2.
 *
 * The browser never talks to the FastAPI backend directly. This exists from
 * Phase 3, serving fixture data, so that Phase 6 only has to change what sits
 * behind it. Three reasons it is worth the indirection:
 *
 *  1. It keeps the backend's real URL and response shape off the public
 *     internet — the same API surface also holds sensitive referral data.
 *  2. It is one place to cache and rate-limit metric reads.
 *  3. It is one place to reshape or redact a response before it reaches a
 *     browser, rather than trusting the backend never to over-return.
 *
 * `getMetrics()` normalises the payload, so only the agreed fields are ever
 * emitted here even if the backend starts returning more.
 */

export const revalidate = 300;

export async function GET() {
  const snapshot = await getMetrics();

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": `public, s-maxage=${METRICS_REVALIDATE_SECONDS}, stale-while-revalidate=${METRICS_REVALIDATE_SECONDS * 2}`,
    },
  });
}
