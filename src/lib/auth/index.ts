import NextAuth from "next-auth";
import type { NextAuthConfig, User } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import { findOrCreateDefaultTeam } from "@/lib/services/find-or-create-default-team";
import { findUserByEmailAndOtp } from "@/lib/services/find-user-by-email-and-otp";
import type { OtpCredentials } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
    } & Partial<User>;
  }
}

const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        try {
          const { email, otp } = credentials as OtpCredentials;
          return await findUserByEmailAndOtp(email, otp);
        } catch (error) {
          console.error("Error authorizing user:", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/sign-in",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id && user.email) {
        await findOrCreateDefaultTeam(user.id);
      }
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
