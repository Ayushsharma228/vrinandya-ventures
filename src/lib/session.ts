import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { Role, Plan, AccountStatus } from "@prisma/client";

export async function getRouteSession(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return null;
  return {
    user: {
      id:              token.id as string,
      role:            token.role as Role,
      plan:            token.plan as Plan | null,
      email:           token.email as string | null,
      name:            token.name as string | null,
      accountStatus:   token.accountStatus as AccountStatus,
      onboardingDone:  token.onboardingDone as boolean,
    },
  };
}
