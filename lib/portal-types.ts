import type { AvailabilityStatus } from "./availability-store";

/**
 * Form state shared between the portal's Server Actions and its client forms.
 *
 * These live here, not beside the actions: a `"use server"` module may only
 * export async functions, so exporting a plain object from one yields
 * `undefined` at runtime and the form crashes on first render.
 */

export type LoginFormState = {
  status: "idle" | "missing" | "invalid" | "error";
};

export const INITIAL_LOGIN_STATE: LoginFormState = { status: "idle" };

export type AvailabilityFormState = {
  status: "idle" | "saved" | "invalidSlots" | "invalidStatus" | "failed";
  /** Echoed back so the form can confirm the change actually landed. */
  savedAt: string | null;
};

export const INITIAL_AVAILABILITY_STATE: AvailabilityFormState = {
  status: "idle",
  savedAt: null,
};

export type { AvailabilityStatus };
