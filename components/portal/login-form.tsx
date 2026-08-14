"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { signInAction } from "@/app/[locale]/(portal)/portal/actions";
import { INITIAL_LOGIN_STATE } from "@/lib/portal-types";

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
      className="w-full rounded bg-teal-500 px-6 py-3 font-bold text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

/**
 * Built on a Server Action, so it submits with no JavaScript — the browser
 * posts natively and the server re-renders. `useActionState` only adds the
 * pending state and the inline error.
 *
 * Errors are deliberately identical for "no such account" and "wrong password".
 * Telling the two apart would let anyone enumerate which organizations are
 * SafeHer partners, which is exactly the sort of thing that should not be
 * discoverable from outside.
 */
export function LoginForm() {
  const t = useTranslations("portal.login");
  const locale = useLocale();
  const [state, formAction] = useActionState(signInAction, INITIAL_LOGIN_STATE);
  const formId = useId();

  const errorKey =
    state.status === "invalid"
      ? "invalid"
      : state.status === "missing"
        ? "missing"
        : state.status === "error"
          ? "error"
          : null;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="locale" value={locale} />

      {errorKey ? (
        <p
          role="alert"
          className="rounded border-2 border-orange-600 bg-orange-50 px-4 py-3 font-medium text-orange-800"
        >
          {t(errorKey)}
        </p>
      ) : null}

      <div>
        <label
          htmlFor={`${formId}-email`}
          className="block font-semibold text-teal-800"
        >
          {t("emailLabel")}
        </label>
        <input
          id={`${formId}-email`}
          name="email"
          type="email"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          className="mt-2 w-full rounded border border-cream-300 bg-white px-4 py-2.5 text-teal-900 focus:border-teal-500"
        />
      </div>

      <div>
        <label
          htmlFor={`${formId}-password`}
          className="block font-semibold text-teal-800"
        >
          {t("passwordLabel")}
        </label>
        <input
          id={`${formId}-password`}
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-2 w-full rounded border border-cream-300 bg-white px-4 py-2.5 text-teal-900 focus:border-teal-500"
        />
      </div>

      <SubmitButton label={t("submit")} pendingLabel={t("submitting")} />
    </form>
  );
}
