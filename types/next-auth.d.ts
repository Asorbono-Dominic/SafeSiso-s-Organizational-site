import type { DefaultSession } from "next-auth";

/**
 * Extends the session with the partner fields the portal renders.
 * Deliberately minimal — nothing about referrals or any girl belongs here.
 */
declare module "next-auth" {
  interface Session {
    user: {
      partnerId: string;
      organization: string;
      region: string;
    } & DefaultSession["user"];
  }

  interface User {
    organization?: string;
    region?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    partnerId?: string;
    organization?: string;
    region?: string;
  }
}
