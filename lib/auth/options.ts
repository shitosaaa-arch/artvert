import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { getUserDirectory } from "@/lib/auth/user-directory-factory";

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
        console.log("=== 1. بدء محاولة تسجيل الدخول ===");
        console.log("الإيميل المدخل:", credentials?.email);

        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
          console.log("=== 2. الرفض: البيانات ناقصة أو صيغة الإيميل غير صحيحة ===");
          return null;
        }

        try {
          const user = await getUserDirectory().findByEmail(email);
          console.log("=== 3. نتيجة البحث في قاعدة البيانات ===");
          console.log(user ? `تم إيجاد المستخدم: ${user.email} والصلاحية: ${user.role}` : "لم يتم العثور على الإيميل في قاعدة البيانات");

          if (!user) {
            return null;
          }

          const isPasswordMatch = await compare(password, user.passwordHash);
          console.log("=== 4. نتيجة مطابقة الباسورد ===", isPasswordMatch ? "متطابق" : "غير متطابق (باسورد غلط)");

          if (!isPasswordMatch) {
            return null;
          }

          console.log("=== 5. نجاح: جاري إنشاء الجلسة للمستخدم ===");
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            sessionExpiresAt:
              Date.now() + (credentials?.remember === "true" ? rememberedSessionMaxAge : standardSessionMaxAge) * 1000,
          };
        } catch (error) {
          console.error("=== خطأ مفاجئ أثناء الاتصال بقاعدة البيانات ===", error);
          return null;
        }
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
        // رجعناها بدون as string عشان تتوافق مع نوع UserRole الخاص بك
        session.user.id = token.userId as any;
        session.user.role = token.role as any;
        session.user.sessionExpiresAt = token.sessionExpiresAt as any;
      }

      return session;
    },
  },
};