import { Role, Plan, AccountStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      plan: Plan | null;
      accountStatus?: AccountStatus;
      onboardingDone?: boolean;
    };
  }

  interface User {
    role: Role;
    plan: Plan | null;
    accountStatus?: AccountStatus;
    onboardingDone?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    plan: Plan | null;
    accountStatus?: AccountStatus;
    onboardingDone?: boolean;
  }
}
