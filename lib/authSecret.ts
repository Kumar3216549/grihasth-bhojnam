// Secret used to sign admin login sessions.
// Set NEXTAUTH_SECRET in production if you can; otherwise it is derived from the (private) database URL,
// so a fresh Vercel + Neon deploy works without an extra secret. Edge-safe: no imports.
export const AUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  (process.env.DATABASE_URL ? `gb-auth::${process.env.DATABASE_URL}` : process.env.NODE_ENV === "production" ? undefined : "gb-dev-secret");
