/**
 * Shared enquiry vocabulary — safe to import from both server and client.
 *
 * This is deliberately separate from `partner-enquiry.ts`, which is marked
 * `server-only`. The form is a Client Component and needs the option list and
 * the field/error types; pulling those from the server module would drag the
 * `server-only` guard into the client bundle and fail the build.
 */

export const ENQUIRY_TYPES = [
  "partner",
  "funder",
  "volunteer",
  "press",
  "other",
] as const;

export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export type EnquiryField =
  "organization" | "name" | "email" | "enquiryType" | "region" | "message";

/**
 * Error codes rather than sentences: the server stays locale-agnostic and the
 * form renders the translated string, so validation messages are never
 * English-only.
 */
export type EnquiryErrorCode =
  "required" | "invalidEmail" | "tooLong" | "invalidOption";

export type EnquiryInput = Record<EnquiryField, string>;

export type EnquiryFieldErrors = Partial<
  Record<EnquiryField, EnquiryErrorCode>
>;

/**
 * Form state for `useActionState`.
 *
 * This lives here, NOT beside the action: a `"use server"` module may only
 * export async functions, so exporting a plain object from it yields
 * `undefined` at runtime and the form crashes on first render.
 */
export type EnquiryFormState = {
  status: "idle" | "success" | "invalid" | "failed";
  fieldErrors: EnquiryFieldErrors;
};

export const INITIAL_ENQUIRY_STATE: EnquiryFormState = {
  status: "idle",
  fieldErrors: {},
};

export type EnquiryResult =
  | { status: "success" }
  | { status: "invalid"; fieldErrors: EnquiryFieldErrors }
  | { status: "failed" };
