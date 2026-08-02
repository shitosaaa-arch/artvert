import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { jsonUserDirectory } from "@/lib/auth/json-user-directory";

const rememberedSessionMaxAge = 60 * 60 * 24 * 30;
const standardSessionMaxAge = 60 * 60 * 8;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: rememberedSessionMaxAge,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember me", type: "checkbox" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
          return null;
        }

        const user = await jsonUserDirectory.findByEmail(email);
        if (!user || !(await compare(password, user.passwordHash))) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sessionExpiresAt:
            Date.now() + (credentials.remember === "true" ? rememberedSessionMaxAge : standardSessionMaxAge) * 1000,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.sessionExpiresAt = user.sessionExpiresAt;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId && token.role && token.sessionExpiresAt) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.sessionExpiresAt = token.sessionExpiresAt;
      }

      return session;
    },
  },
};
