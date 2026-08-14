"use server";

import { submitEnquiry } from "@/lib/partner-enquiry";
import type { EnquiryFormState } from "@/lib/enquiry-types";

/**
 * A `"use server"` module may only export async functions. The form's initial
 * state and its type therefore live in `lib/enquiry-types.ts` — exporting a
 * plain object from here resolves to `undefined` in the client bundle.
 */

function read(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function submitEnquiryAction(
  _previous: EnquiryFormState,
  formData: FormData,
): Promise<EnquiryFormState> {
  // Honeypot. A real person never sees or fills this; bots fill everything.
  // Report success so the bot gets no signal to adapt to, but deliver nothing.
  if (read(formData, "website").trim() !== "") {
    return { status: "success", fieldErrors: {} };
  }

  const result = await submitEnquiry({
    organization: read(formData, "organization"),
    name: read(formData, "name"),
    email: read(formData, "email"),
    enquiryType: read(formData, "enquiryType"),
    region: read(formData, "region"),
    message: read(formData, "message"),
  });

  if (result.status === "invalid") {
    return { status: "invalid", fieldErrors: result.fieldErrors };
  }

  return { status: result.status, fieldErrors: {} };
}
