// ONE-TIME bootstrap endpoint — DELETE THIS FILE after use
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const secret = process.env.BOOTSTRAP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Bootstrap disabled" }, { status: 403 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const email = "connect@vrinandyaventures.in";
  const password = "8533949379@aA";

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.role !== "ADMIN") {
        await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
        return NextResponse.json({ message: "Role updated to ADMIN", email });
      }
      return NextResponse.json({ message: "Admin already exists", email });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: "Axiqen Admin",
        email,
        password: hashed,
        role: "ADMIN",
        accountStatus: "ACTIVE",
        onboardingDone: true,
      },
    });

    return NextResponse.json({ message: "Admin created", email: user.email, id: user.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "DB error", detail: message }, { status: 500 });
  }
}
