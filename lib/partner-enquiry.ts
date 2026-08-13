import "server-only";

import {
  ENQUIRY_TYPES,
  type EnquiryField,
  type EnquiryFieldErrors,
  type EnquiryInput,
  type EnquiryResult,
  type EnquiryType,
} from "./enquiry-types";

/**
 * Partner / funder / volunteer enquiries — server side only.
 *
 * THE SWAP POINT: `deliverEnquiry` below is the only thing that changes when a
 * real destination exists (a backend endpoint, a transactional email service, a
 * CRM). Validation, the action and the form all stay untouched. See Phase 6 in
 * the README.
 *
 * PRIVACY BOUNDARY: this form is for ORGANIZATIONS, never for girls seeking
 * help. The site must not invite a minor to submit identifying details through
 * a public channel (Spec Section 9), so there is deliberately no "your age",
 * no "your location", and no free-text field presented as a place to describe a
 * personal situation. The page says so plainly and routes girls to WhatsApp.
 *
 * Shared option lists and types live in `enquiry-types.ts` so the Client
 * Component form can import them without pulling `server-only` into the browser
 * bundle.
 */

const MAX_LENGTHS: Record<EnquiryField, number> = {
  organization: 200,
  name: 120,
  email: 254,
  enquiryType: 40,
  region: 60,
  message: 4000,
};

/** Deliberately permissive — the aim is to catch typos, not police addresses. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEnquiry(input: EnquiryInput): EnquiryFieldErrors {
  const fieldErrors: EnquiryFieldErrors = {};

  const required: EnquiryField[] = [
    "organization",
    "name",
    "email",
    "enquiryType",
    "message",
  ];

  for (const field of required) {
    if (!input[field]?.trim()) fieldErrors[field] = "required";
  }

  for (const field of Object.keys(MAX_LENGTHS) as EnquiryField[]) {
    if (!fieldErrors[field] && input[field]?.length > MAX_LENGTHS[field]) {
      fieldErrors[field] = "tooLong";
    }
  }

  if (!fieldErrors.email && !EMAIL_PATTERN.test(input.email.trim())) {
    fieldErrors.email = "invalidEmail";
  }

  if (
    !fieldErrors.enquiryType &&
    !ENQUIRY_TYPES.includes(input.enquiryType as EnquiryType)
  ) {
    fieldErrors.enquiryType = "invalidOption";
  }

  return fieldErrors;
}

/**
 * Hand the enquiry to wherever it needs to go.
 *
 * There is no confirmed destination yet, so this logs server-side and reports
 * success. That is deliberate rather than silently dropping the message: a
 * partner organization that fills in this form gets an honest confirmation, and
 * the enquiry is recoverable from the server log in the meantime.
 *
 * TODO (Phase 6): point PARTNER_ENQUIRY_ENDPOINT at the real destination. Only
 * this function should need to change.
 */
async function deliverEnquiry(input: EnquiryInput): Promise<boolean> {
  const destination = process.env.PARTNER_ENQUIRY_ENDPOINT;

  if (!destination) {
    console.info(
      "[partner-enquiry] No PARTNER_ENQUIRY_ENDPOINT configured — logging instead.",
      {
        receivedAt: new Date().toISOString(),
        organization: input.organization,
        name: input.name,
        email: input.email,
        enquiryType: input.enquiryType,
        region: input.region || "(not given)",
        message: input.message,
      },
    );
    return true;
  }

  try {
    const response = await fetch(destination, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.PARTNER_ENQUIRY_TOKEN
          ? { Authorization: `Bearer ${process.env.PARTNER_ENQUIRY_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `[partner-enquiry] Destination responded ${response.status}.`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("[partner-enquiry] Delivery threw.", error);
    return false;
  }
}

export async function submitEnquiry(
  input: EnquiryInput,
): Promise<EnquiryResult> {
  const fieldErrors = validateEnquiry(input);

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "invalid", fieldErrors };
  }

  const delivered = await deliverEnquiry({
    organization: input.organization.trim(),
    name: input.name.trim(),
    email: input.email.trim(),
    enquiryType: input.enquiryType,
    region: input.region.trim(),
    message: input.message.trim(),
  });

  return delivered ? { status: "success" } : { status: "failed" };
}
