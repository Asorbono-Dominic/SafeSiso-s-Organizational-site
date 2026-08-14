/// <reference types="next" />
/// <reference types="next/image-types/global" />

/**
 * Committed counterpart to the generated `next-env.d.ts`.
 *
 * `next-env.d.ts` is gitignored (that is how create-next-app scaffolds it) and
 * is only written by `next dev` / `next build`. That is fine for the framework
 * globals, but the second reference above is what declares module types for
 * static image imports — so on a clean CI checkout, where neither the file nor
 * a prior build exists, `import logoMark from "@/public/logo-mark.png"` fails
 * typecheck with TS2307 while passing locally.
 *
 * That is exactly what broke CI #10: `tsc --noEmit` runs before `next build`,
 * so nothing has generated the types yet. Declaring them here keeps typecheck
 * self-sufficient and independent of build order.
 */

export {};
