import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { logMagicLinkToConsole } from "@/lib/dev-mail";

const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * Edge-safe Auth.js config: providers, pages, and the `authorized` callback
 * that middleware.ts uses to gate routes. Deliberately excludes the Prisma
 * adapter (see auth.ts) so this can run in the Edge middleware runtime.
 */
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST ?? "localhost",
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER ?? "",
          pass: process.env.EMAIL_SERVER_PASSWORD ?? "",
        },
      },
      from: process.env.EMAIL_FROM ?? "Ball Knowledge <no-reply@ball-knowledge.app>",
      // No real SMTP account is configured in dev yet — log the magic link instead
      // of attempting to send mail. See AGENTS.md section 6 for the eventual env vars.
      ...(isDevelopment
        ? { sendVerificationRequest: logMagicLinkToConsole }
        : {}),
    }),
  ],
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/verify-request",
    error: "/auth-error",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");

      if (isProtectedRoute) {
        return isLoggedIn;
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
