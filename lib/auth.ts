import crypto from "crypto";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { AUTH_SECRET } from "./authSecret";

function safeEqual(a: string, b: string) {
  const x = crypto.createHash("sha256").update(a).digest();
  const y = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(x, y);
}

export const authOptions: NextAuthOptions = {
  secret: AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      name: "Admin",
      credentials: { username: { label: "Username" }, password: { label: "Password", type: "password" } },
      async authorize(c) {
        const user = process.env.ADMIN_USERNAME || "sachin";
        const pass = process.env.ADMIN_PASSWORD;
        if (!pass || pass.length < 8) {
          console.error("[auth] ADMIN_PASSWORD missing or shorter than 8 characters");
          return null;
        }
        if (c?.username && c?.password && safeEqual(c.username.trim().toLowerCase(), user.toLowerCase()) && safeEqual(c.password, pass)) {
          return { id: "admin", name: "Sachin", email: process.env.ADMIN_EMAIL || null };
        }
        await new Promise((r) => setTimeout(r, 800)); // slow down guessing
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = "admin";
      return token;
    },
    async session({ session, token }) {
      (session as { role?: string }).role = token.role as string;
      return session;
    },
  },
};

export async function isAdmin() {
  const s = await getServerSession(authOptions);
  return (s as { role?: string } | null)?.role === "admin";
}

/** Call at the top of every admin page and server action. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
