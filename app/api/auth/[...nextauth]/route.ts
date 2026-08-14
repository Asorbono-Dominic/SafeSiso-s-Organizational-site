import { handlers } from "@/auth";

/**
 * NextAuth's endpoints. Not locale-prefixed, and excluded from the i18n proxy
 * by the `api` branch of its matcher.
 */
export const { GET, POST } = handlers;
