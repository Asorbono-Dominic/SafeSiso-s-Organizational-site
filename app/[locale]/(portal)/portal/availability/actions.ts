"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  AVAILABILITY_STATUSES,
  setAvailability,
  type AvailabilityStatus,
} from "@/lib/availability-store";
import type { AvailabilityFormState } from "@/lib/portal-types";

export async function updateAvailabilityAction(
  _previous: AvailabilityFormState,
  formData: FormData,
): Promise<AvailabilityFormState> {
  /**
   * The partner is taken from the SESSION, never from the form.
   *
   * A hidden partnerId field would let anyone signed in post a different
   * organization's id and mark it available — which in this system means
   * sending a girl to a door that is actually shut.
   */
  const session = await auth();
  const partnerId = session?.user?.partnerId;

  if (!partnerId) {
    return { status: "failed", savedAt: null };
  }

  const status = String(formData.get("status") ?? "");
  if (!AVAILABILITY_STATUSES.includes(status as AvailabilityStatus)) {
    return { status: "invalidStatus", savedAt: null };
  }

  const rawSlots = String(formData.get("openSlots") ?? "").trim();
  let openSlots: number | null = null;

  if (rawSlots !== "") {
    const parsed = Number(rawSlots);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 1000) {
      return { status: "invalidSlots", savedAt: null };
    }
    openSlots = parsed;
  }

  const note = String(formData.get("note") ?? "").slice(0, 500);

  try {
    const record = await setAvailability(partnerId, {
      status: status as AvailabilityStatus,
      openSlots,
      note,
    });

    revalidatePath("/[locale]/(portal)/portal/availability", "page");
    return { status: "saved", savedAt: record.updatedAt };
  } catch (error) {
    console.error("[availability] Update failed.", error);
    return { status: "failed", savedAt: null };
  }
}
