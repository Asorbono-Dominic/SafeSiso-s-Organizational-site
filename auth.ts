import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyPartnerCredentials } from "@/lib/partner-accounts";

/**
 * SafeHer partner portal authentication.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE: the session token is never handed to
 * client-side JavaScript. NextAuth's JWT strategy keeps it in an httpOnly,
 * SameSite=Lax cookie — the browser sends it automatically and `document.cookie`
 * cannot read it. That matters more here than on a typical site, because this
 * portal is tied to referrals involving minors, and an XSS bug that could lift a
 * token out of localStorage would be a safeguarding incident rather than an
 * inconvenience. See Spec 8.4.
 *
 * Phase 6 swaps `verifyPartnerCredentials` for the FastAPI backend. The backend
 * may well issue its own JWT at that point; it must be exchanged for a session
 * on THIS side and never forwarded to the browser.
 */

/**
 * `secure` is derived from the deployment URL rather than hardcoded. Forcing it
 * on would break plain-http local development, and forcing it off would ship an
 * insecure cookie to production. NextAuth also prefixes the cookie with
 * `__Secure-` when this is on.
 */
const useSecureCookies =
  process.env.NODE_ENV === "production" ||
  (process.env.NEXTAUTH_URL ?? "").startsWith("https://");

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    // Clinic and NGO staff share workstations. A session that lasts for weeks
    // is a session someone else walks up to.
    maxAge: 60 * 60 * 8,
  },
  useSecureCookies,
  pages: {
    // Our own login screen, so the portal keeps its own visual register
    // instead of NextAuth's default page.
    signIn: "/en/portal",
    error: "/en/portal",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) return null;

        const account = await verifyPartnerCredentials(email, password);
        if (!account) return null;

        return {
          id: account.id,
          email: account.email,
          name: account.name,
          organization: account.organization,
          region: account.region,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.partnerId = user.id;
        token.organization = (user as { organization?: string }).organization;
        token.region = (user as { region?: string }).region;
      }
      return token;
    },
    async session({ session, token }) {
      // Only what the portal UI actually renders. Nothing about referrals or
      // any girl ever belongs in a session token.
      session.user.partnerId = token.partnerId as string;
      session.user.organization = token.organization as string;
      session.user.region = token.region as string;
      return session;
    },
  },
});
