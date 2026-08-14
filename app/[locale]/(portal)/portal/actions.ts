"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

/**
 * A `"use server"` module may only export async functions, so the state type
 * and its initial value live in lib/portal-types.ts.
 */
import type { LoginFormState } from "@/lib/portal-types";

export async function signInAction(
  _previous: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "en");

  if (!email || !password) {
    return { status: "missing" };
  }

  try {
    // `redirectTo` keeps the visitor in the locale they were already using.
    await signIn("credentials", {
      email,
      password,
      redirectTo: `/${locale}/portal/availability`,
    });
  } catch (error) {
    // NextAuth signals a successful redirect by throwing, so this has to be
    // rethrown or login silently fails.
    if (error instanceof AuthError) {
      return error.type === "CredentialsSignin"
        ? { status: "invalid" }
        : { status: "error" };
    }
    throw error;
  }

  return { status: "idle" };
}
