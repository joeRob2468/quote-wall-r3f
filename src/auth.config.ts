import type { NextAuthConfig } from "next-auth";

// Edge-safe config shared with middleware. Anything that touches the
// database (adapter, providers that look up users, DB-backed callbacks)
// belongs in auth.ts, since Prisma can't run on the Edge runtime.
export const authConfig = {
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig;
