import { withAuth } from "next-auth/middleware";
import { AUTH_SECRET } from "./lib/authSecret";

export default withAuth({
  secret: AUTH_SECRET,
  pages: { signIn: "/admin/login" },
  callbacks: { authorized: ({ token }) => token?.role === "admin" },
});

// Protect every admin page and admin API, except the login page itself.
export const config = { matcher: ["/admin", "/admin/((?!login).*)", "/api/admin/:path*"] };
