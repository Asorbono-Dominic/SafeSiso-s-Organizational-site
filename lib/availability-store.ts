import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * SafeHer partner availability — Phase 5 mock store.
 *
 * THE SWAP POINT: `readAll` and `writeAll` are the only functions that change
 * in Phase 6, when this reads and writes through the FastAPI backend instead.
 * The shape below is the contract; agreeing it now keeps that a swap.
 *
 * Persisted to a JSON file under `.data/` so a toggle survives a page reload
 * and a dev-server restart, which an in-memory Map would not. Falls back to
 * memory when the filesystem is read-only (serverless), because losing a mock
 * toggle is better than a 500.
 */

export type AvailabilityStatus =
  /** Accepting referrals now. */
  | "available"
  /** Reachable, but at capacity — the matching engine should look elsewhere. */
  | "full"
  /** Closed. Not reachable at all right now. */
  | "closed";

export const AVAILABILITY_STATUSES: AvailabilityStatus[] = [
  "available",
  "full",
  "closed",
];

export type AvailabilityRecord = {
  partnerId: string;
  status: AvailabilityStatus;
  /** Free capacity the partner reports. Null when they do not track it. */
  openSlots: number | null;
  /** ISO timestamp of the last change, shown so staff can see it took. */
  updatedAt: string | null;
  /** Optional short note for the coordinating team. */
  note: string | null;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "availability.json");

/** Used when the filesystem is not writable. Resets on restart, by design. */
let memoryFallback: Record<string, AvailabilityRecord> | null = null;
let usingMemory = false;

/**
 * A partner with no record yet is CLOSED, not available.
 *
 * This default is deliberate and is the single most important line in this
 * file: the matching engine must never treat "we have not heard from them" as
 * "they can take a girl right now". Sending a girl to a door that turns out to
 * be shut is a real harm, so absence of information fails closed.
 */
export function defaultRecord(partnerId: string): AvailabilityRecord {
  return {
    partnerId,
    status: "closed",
    openSlots: null,
    updatedAt: null,
    note: null,
  };
}

async function readAll(): Promise<Record<string, AvailabilityRecord>> {
  if (usingMemory) return memoryFallback ?? {};

  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, AvailabilityRecord>;
  } catch {
    // Missing file on first run is normal, not an error.
    return {};
  }
}

async function writeAll(all: Record<string, AvailabilityRecord>) {
  if (usingMemory) {
    memoryFallback = all;
    return;
  }

  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(all, null, 2), "utf8");
  } catch {
    console.warn(
      "[availability] Filesystem not writable — falling back to in-memory store. State will reset on restart.",
    );
    usingMemory = true;
    memoryFallback = all;
  }
}

export async function getAvailability(
  partnerId: string,
): Promise<AvailabilityRecord> {
  const all = await readAll();
  return all[partnerId] ?? defaultRecord(partnerId);
}

export async function setAvailability(
  partnerId: string,
  update: {
    status: AvailabilityStatus;
    openSlots: number | null;
    note: string | null;
  },
): Promise<AvailabilityRecord> {
  const all = await readAll();

  const record: AvailabilityRecord = {
    partnerId,
    status: update.status,
    // "Closed" and "full" both mean nobody can be sent, so a leftover slot
    // count would contradict the status the coordinator just set.
    openSlots: update.status === "available" ? update.openSlots : null,
    note: update.note?.trim() ? update.note.trim() : null,
    updatedAt: new Date().toISOString(),
  };

  all[partnerId] = record;
  await writeAll(all);
  return record;
}
