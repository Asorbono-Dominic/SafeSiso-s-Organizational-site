"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { submitEnquiryAction } from "@/app/[locale]/get-involved/actions";
import {
  ENQUIRY_TYPES,
  INITIAL_ENQUIRY_STATE,
  type EnquiryField,
} from "@/lib/enquiry-types";
import { TARGET_REGIONS } from "@/lib/site-config";
import { Icon } from "./icons";

/**
 * Built on a Server Action so the form still submits when JavaScript has not
 * loaded — the browser posts it natively and the server re-renders with the
 * result. `useActionState` only adds the pending state and inline errors.
 *
 * Validation errors travel as codes, not sentences, so they render in the
 * visitor's language rather than always in English.
 */

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
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-500 px-6 py-3 font-bold text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function EnquiryForm() {
  const t = useTranslations("getInvolved.form");
  const tRegions = useTranslations("regions");
  const [state, formAction] = useActionState(
    submitEnquiryAction,
    INITIAL_ENQUIRY_STATE,
  );
  const formId = useId();

  const fieldId = (field: string) => `${formId}-${field}`;
  const errorId = (field: string) => `${formId}-${field}-error`;

  const errorFor = (field: EnquiryField) => {
    const code = state.fieldErrors[field];
    return code ? t(`errors.${code}`) : null;
  };

  const describedBy = (field: EnquiryField) =>
    state.fieldErrors[field] ? errorId(field) : undefined;

  const inputClass = (field: EnquiryField) =>
    `w-full rounded-lg border bg-white px-4 py-2.5 text-teal-900 ${
      state.fieldErrors[field]
        ? "border-orange-700"
        : "border-cream-300 focus:border-teal-500"
    }`;

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="rounded-xl border-2 border-teal-500 bg-teal-50 p-6 sm:p-8"
      >
        <h3 className="flex items-center gap-2 text-xl font-bold text-teal-600">
          <Icon name="check" className="h-6 w-6" />
          {t("successHeading")}
        </h3>
        <p className="mt-3 max-w-prose leading-relaxed text-teal-800">
          {t("successBody")}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.status === "failed" ? (
        <p
          role="alert"
          className="rounded-lg border-2 border-orange-600 bg-orange-50 px-5 py-4 font-medium text-orange-800"
        >
          {t("failedMessage")}
        </p>
      ) : null}

      {state.status === "invalid" ? (
        <p
          role="alert"
          className="rounded-lg border-2 border-orange-600 bg-orange-50 px-5 py-4 font-medium text-orange-800"
        >
          {t("invalidMessage")}
        </p>
      ) : null}

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor={fieldId("website")}>{t("honeypotLabel")}</label>
        <input
          id={fieldId("website")}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor={fieldId("organization")}
            className="block font-semibold text-teal-800"
          >
            {t("organizationLabel")} <span aria-hidden="true">*</span>
          </label>
          <input
            id={fieldId("organization")}
            name="organization"
            type="text"
            required
            autoComplete="organization"
            aria-describedby={describedBy("organization")}
            aria-invalid={Boolean(state.fieldErrors.organization)}
            className={`mt-2 ${inputClass("organization")}`}
          />
          {errorFor("organization") ? (
            <p
              id={errorId("organization")}
              className="mt-1.5 text-sm font-medium text-orange-800"
            >
              {errorFor("organization")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={fieldId("name")}
            className="block font-semibold text-teal-800"
          >
            {t("nameLabel")} <span aria-hidden="true">*</span>
          </label>
          <input
            id={fieldId("name")}
            name="name"
            type="text"
            required
            autoComplete="name"
            aria-describedby={describedBy("name")}
            aria-invalid={Boolean(state.fieldErrors.name)}
            className={`mt-2 ${inputClass("name")}`}
          />
          {errorFor("name") ? (
            <p
              id={errorId("name")}
              className="mt-1.5 text-sm font-medium text-orange-800"
            >
              {errorFor("name")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={fieldId("email")}
            className="block font-semibold text-teal-800"
          >
            {t("emailLabel")} <span aria-hidden="true">*</span>
          </label>
          <input
            id={fieldId("email")}
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-describedby={describedBy("email")}
            aria-invalid={Boolean(state.fieldErrors.email)}
            className={`mt-2 ${inputClass("email")}`}
          />
          {errorFor("email") ? (
            <p
              id={errorId("email")}
              className="mt-1.5 text-sm font-medium text-orange-800"
            >
              {errorFor("email")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={fieldId("enquiryType")}
            className="block font-semibold text-teal-800"
          >
            {t("enquiryTypeLabel")} <span aria-hidden="true">*</span>
          </label>
          <select
            id={fieldId("enquiryType")}
            name="enquiryType"
            required
            defaultValue="partner"
            aria-describedby={describedBy("enquiryType")}
            aria-invalid={Boolean(state.fieldErrors.enquiryType)}
            className={`mt-2 ${inputClass("enquiryType")}`}
          >
            {ENQUIRY_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`enquiryTypes.${type}`)}
              </option>
            ))}
          </select>
          {errorFor("enquiryType") ? (
            <p
              id={errorId("enquiryType")}
              className="mt-1.5 text-sm font-medium text-orange-800"
            >
              {errorFor("enquiryType")}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label
          htmlFor={fieldId("region")}
          className="block font-semibold text-teal-800"
        >
          {t("regionLabel")}
        </label>
        <select
          id={fieldId("region")}
          name="region"
          defaultValue=""
          className={`mt-2 ${inputClass("region")}`}
        >
          <option value="">{t("regionUnspecified")}</option>
          {TARGET_REGIONS.map((region) => (
            <option key={region} value={region}>
              {tRegions(region)}
            </option>
          ))}
          <option value="other">{t("regionOther")}</option>
        </select>
      </div>

      <div>
        <label
          htmlFor={fieldId("message")}
          className="block font-semibold text-teal-800"
        >
          {t("messageLabel")} <span aria-hidden="true">*</span>
        </label>
        <p className="mt-1 max-w-prose text-sm text-teal-700">
          {t("messageHelp")}
        </p>
        <textarea
          id={fieldId("message")}
          name="message"
          rows={6}
          required
          aria-describedby={describedBy("message")}
          aria-invalid={Boolean(state.fieldErrors.message)}
          className={`mt-2 ${inputClass("message")}`}
        />
        {errorFor("message") ? (
          <p
            id={errorId("message")}
            className="mt-1.5 text-sm font-medium text-orange-800"
          >
            {errorFor("message")}
          </p>
        ) : null}
      </div>

      <p className="max-w-prose text-sm text-teal-700">{t("privacyNote")}</p>

      <SubmitButton label={t("submit")} pendingLabel={t("submitting")} />
    </form>
  );
}
