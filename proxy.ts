import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Locale negotiation and redirects.
 *
 * This is Next 16's `proxy.ts` — the successor to `middleware.ts`. next-intl
 * still names its factory `createMiddleware`; only the Next.js file convention
 * changed.
 */
export default createMiddleware(routing);

export const config = {
  /**
   * Run on every path EXCEPT:
   *  - /api/*      route handlers (the metrics proxy, Phase 3+)
   *  - /_next/*    build output
   *  - /_vercel/*  platform internals
   *  - anything containing a dot (static files: /favicon.ico, /logo.svg, ...)
   */
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
