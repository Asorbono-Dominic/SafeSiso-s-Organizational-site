import { signOut } from "@/auth";

/**
 * Sign out via a Server Action inside a form, not an onClick handler.
 *
 * Two reasons: it works without JavaScript, and a POST is the correct method
 * for a state-changing action — a GET link would be followed by link
 * prefetchers and could sign staff out by accident.
 */
export function SignOutButton({ label }: { label: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/en/portal" });
      }}
    >
      <button
        type="submit"
        className="rounded border border-cream-300/40 px-3 py-1 font-semibold text-cream-100 hover:bg-teal-800"
      >
        {label}
      </button>
    </form>
  );
}
