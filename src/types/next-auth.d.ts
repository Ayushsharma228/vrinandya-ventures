import { Role, Plan } from "@prisma/client";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      plan: Plan | null;
    };
  }

  interface User {
    role: Role;
    plan: Plan | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    plan: Plan | null;
    id: string;
  }
}
