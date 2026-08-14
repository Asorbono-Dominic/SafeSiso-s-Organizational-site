"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { updateAvailabilityAction } from "@/app/[locale]/(portal)/portal/availability/actions";
import {
  INITIAL_AVAILABILITY_STATE,
  type AvailabilityStatus,
} from "@/lib/portal-types";

const STATUSES: AvailabilityStatus[] = ["available", "full", "closed"];

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-teal-500 px-6 py-3 font-bold text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

/**
 * Availability control.
 *
 * Radio buttons rather than a switch or slider: there are three states, not
 * two, and "at capacity" is meaningfully different from "closed". A binary
 * toggle would force staff to misreport one of them. Radios are also the
 * option that works with no JavaScript and reads correctly to a screen reader
 * without any ARIA.
 */
export function AvailabilityForm({
  initialStatus,
  initialSlots,
  initialNote,
}: {
  initialStatus: AvailabilityStatus;
  initialSlots: number | null;
  initialNote: string | null;
}) {
  const t = useTranslations("portal.availability");
  const [state, formAction] = useActionState(
    updateAvailabilityAction,
    INITIAL_AVAILABILITY_STATE,
  );
  const formId = useId();

  // Slot count only means anything while accepting referrals, so the field is
  // hidden otherwise rather than sitting there collecting a contradiction.
  const [status, setStatus] = useState<AvailabilityStatus>(initialStatus);

  const errorKey =
    state.status === "invalidSlots"
      ? "invalidSlots"
      : state.status === "invalidStatus"
        ? "invalidStatus"
        : state.status === "failed"
          ? "failed"
          : null;

  return (
    <form action={formAction} className="space-y-8" noValidate>
      {state.status === "saved" ? (
        <p
          role="status"
          className="rounded border-2 border-teal-500 bg-teal-50 px-4 py-3 font-medium text-teal-700"
        >
          {t("saved")}
        </p>
      ) : null}

      {errorKey ? (
        <p
          role="alert"
          className="rounded border-2 border-orange-600 bg-orange-50 px-4 py-3 font-medium text-orange-800"
        >
          {t(errorKey)}
        </p>
      ) : null}

      <fieldset>
        <legend className="font-semibold text-teal-800">
          {t("statusLabel")}
        </legend>
        <div className="mt-3 space-y-2">
          {STATUSES.map((option) => (
            <label
              key={option}
              className={`flex cursor-pointer gap-3 rounded border-2 p-4 ${
                status === option
                  ? "border-teal-500 bg-teal-50"
                  : "border-cream-300 bg-white hover:bg-cream-50"
              }`}
            >
              <input
                type="radio"
                name="status"
                value={option}
                checked={status === option}
                onChange={() => setStatus(option)}
                className="mt-1 h-5 w-5 shrink-0 accent-teal-500"
              />
              <span>
                <span className="block font-semibold text-teal-800">
                  {t(`statuses.${option}.label`)}
                </span>
                <span className="mt-0.5 block text-sm text-teal-700">
                  {t(`statuses.${option}.help`)}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {status === "available" ? (
        <div>
          <label
            htmlFor={`${formId}-slots`}
            className="block font-semibold text-teal-800"
          >
            {t("slotsLabel")}
          </label>
          <p className="mt-1 text-sm text-teal-700">{t("slotsHelp")}</p>
          <input
            id={`${formId}-slots`}
            name="openSlots"
            type="number"
            min={0}
            max={1000}
            step={1}
            inputMode="numeric"
            defaultValue={initialSlots ?? ""}
            className="mt-2 w-32 rounded border border-cream-300 bg-white px-4 py-2.5 text-teal-900 focus:border-teal-500"
          />
        </div>
      ) : null}

      <div>
        <label
          htmlFor={`${formId}-note`}
          className="block font-semibold text-teal-800"
        >
          {t("noteLabel")}
        </label>
        <p className="mt-1 text-sm text-teal-700">{t("noteHelp")}</p>
        <textarea
          id={`${formId}-note`}
          name="note"
          rows={3}
          maxLength={500}
          defaultValue={initialNote ?? ""}
          className="mt-2 w-full rounded border border-cream-300 bg-white px-4 py-2.5 text-teal-900 focus:border-teal-500"
        />
      </div>

      <SubmitButton label={t("save")} pendingLabel={t("saving")} />
    </form>
  );
}
