import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "connect@vrinandyaventures.in";
  const password = "8533949379@aA";
  const name = "Axiqen Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User already exists: ${email} (role: ${existing.role})`);
    if (existing.role !== "ADMIN") {
      await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
      console.log("Role updated to ADMIN.");
    }
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: "ADMIN",
      accountStatus: "ACTIVE",
      onboardingDone: true,
    },
  });

  console.log(`Admin created: ${user.email} (id: ${user.id})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
