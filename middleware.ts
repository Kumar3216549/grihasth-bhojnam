import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/admin/login" },
  callbacks: { authorized: ({ token }) => token?.role === "admin" },
});

// Protect every admin page and admin API, except the login page itself.
export const config = { matcher: ["/admin", "/admin/((?!login).*)", "/api/admin/:path*"] };
