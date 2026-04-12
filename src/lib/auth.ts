import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role, Plan, AccountStatus } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    newUser: "/signup",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("No account found with this email");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: user.plan,
          accountStatus: user.accountStatus,
          onboardingDone: user.onboardingDone,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role as Role;
        token.plan = user.plan as Plan | null;
        token.id = user.id;
        token.accountStatus = user.accountStatus as AccountStatus;
        token.onboardingDone = user.onboardingDone as boolean;
      }
      if (trigger === "update") {
        if (session?.plan) token.plan = session.plan;
        if (session?.accountStatus) token.accountStatus = session.accountStatus;
        if (session?.onboardingDone !== undefined) token.onboardingDone = session.onboardingDone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.plan = token.plan as Plan | null;
        session.user.accountStatus = token.accountStatus as AccountStatus;
        session.user.onboardingDone = token.onboardingDone as boolean;
      }
      return session;
    },
  },
};
