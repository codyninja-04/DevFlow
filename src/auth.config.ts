import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

// Lightweight config — NO Prisma/DB imports.
// Used by proxy.ts to avoid bundling heavy DB clients into the proxy bundle.
export const authConfig = {
  providers: [Google],
  pages: {
    signIn: "/sign-in",
  },
} satisfies NextAuthConfig
