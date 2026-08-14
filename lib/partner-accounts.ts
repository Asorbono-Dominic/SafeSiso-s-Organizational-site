import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Seeded SafeHer partner accounts — Phase 5 mock credential store.
 *
 * THE SWAP POINT: `verifyPartnerCredentials` is the only thing that changes in
 * Phase 6, when the FastAPI backend authenticates instead. The session shape
 * and everything above it stays put.
 *
 * These are TEST accounts for a pre-launch pilot, and they are DISABLED unless
 * explicitly enabled:
 *
 *   - Local development: a fallback password is allowed, because the only
 *     person reaching it is the developer running the dev server.
 *   - Any production build: the seeded accounts exist ONLY if
 *     PORTAL_DEV_PASSWORD is set. Without it there are no accounts at all and
 *     every login attempt fails.
 *
 * That second rule is the important one. A hardcoded fallback would mean a
 * deployed portal was protected by a password published in a public Git
 * repository — which is not a lower standard than production, it is no
 * standard at all. Failing closed is the only safe default.
 *
 * Passwords are hashed with scrypt (Node built-in — no bcrypt dependency) and
 * compared in constant time, because writing a mock is not a reason to
 * demonstrate the wrong pattern to whoever reads this next.
 */

const IS_DEV = process.env.NODE_ENV !== "production";

/** Local-development fallback. Never used in a production build. */
const DEV_FALLBACK_PASSWORD = "safeher-dev-only";

const CONFIGURED_PASSWORD = process.env.PORTAL_DEV_PASSWORD?.trim() || null;

/**
 * The password the seeded accounts use, or null when they are disabled.
 * Null in any production build with no PORTAL_DEV_PASSWORD configured.
 */
const SEED_PASSWORD =
  CONFIGURED_PASSWORD ?? (IS_DEV ? DEV_FALLBACK_PASSWORD : null);

export const SEEDED_ACCOUNTS_ENABLED = SEED_PASSWORD !== null;

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export type PartnerAccount = {
  id: string;
  email: string;
  /** Organization display name shown in the portal. */
  organization: string;
  /** Contact person, shown as "signed in as". */
  name: string;
  /** Region key — matches TARGET_REGIONS in site-config. */
  region: string;
};

type SeededAccount = PartnerAccount & { password: string };

/**
 * Seeded accounts. Deliberately obvious rather than realistic-looking, so
 * nobody mistakes a seeded row for a real partner. Empty when disabled.
 */
const DEV_ACCOUNTS: SeededAccount[] =
  SEED_PASSWORD === null
    ? []
    : [
        {
          id: "partner-tamale",
          email: "tamale@safeher.test",
          organization: "Tamale Adolescent Health Centre (TEST)",
          name: "Test Coordinator",
          region: "northern",
          password: SEED_PASSWORD,
        },
        {
          id: "partner-bolgatanga",
          email: "bolgatanga@safeher.test",
          organization: "Bolgatanga Girls Support Unit (TEST)",
          name: "Test Coordinator",
          region: "upperEast",
          password: SEED_PASSWORD,
        },
      ];

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const derived = (await scryptAsync(
    password,
    Buffer.from(saltHex, "hex"),
    KEY_LENGTH,
  )) as Buffer;
  const expected = Buffer.from(hashHex, "hex");

  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

/**
 * Hashes are computed once per process rather than stored as literals, so no
 * password hash is committed to the repository.
 */
let hashedAccounts: Promise<(PartnerAccount & { hash: string })[]> | null =
  null;

function getAccounts() {
  hashedAccounts ??= Promise.all(
    DEV_ACCOUNTS.map(async ({ password, ...account }) => ({
      ...account,
      hash: await hashPassword(password),
    })),
  );
  return hashedAccounts;
}

export async function verifyPartnerCredentials(
  email: string,
  password: string,
): Promise<PartnerAccount | null> {
  const accounts = await getAccounts();
  const account = accounts.find(
    (candidate) => candidate.email === email.trim().toLowerCase(),
  );

  // Hash even when the account does not exist, so a wrong email and a wrong
  // password take the same time and cannot be told apart by timing.
  const stored =
    account?.hash ?? (await hashPassword("no-such-account-placeholder"));
  const ok = await verifyPassword(password, stored);

  if (!account || !ok) return null;

  const { hash: _hash, ...safe } = account;
  return safe;
}

export async function getPartnerById(
  id: string,
): Promise<PartnerAccount | null> {
  const accounts = await getAccounts();
  const account = accounts.find((candidate) => candidate.id === id);
  if (!account) return null;
  const { hash: _hash, ...safe } = account;
  return safe;
}

/**
 * Test credentials for the login screen, or null when they must not be shown.
 *
 * Returned as a single object rather than separate exports so there is exactly
 * one condition governing whether credentials appear on screen, and no way to
 * render the password by importing a different symbol.
 *
 * NEVER non-null in a production build. Local development only — a deployed
 * portal must not print its own password, even a test one, because "test" and
 * "publicly reachable" together is just a weak login.
 */
export const TEST_CREDENTIALS: {
  emails: string[];
  password: string;
} | null =
  IS_DEV && SEED_PASSWORD !== null
    ? { emails: DEV_ACCOUNTS.map((a) => a.email), password: SEED_PASSWORD }
    : null;
