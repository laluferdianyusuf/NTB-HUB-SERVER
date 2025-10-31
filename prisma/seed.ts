import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@billiard.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      name: "Ferdian",
      email: "user@billiard.com",
      password: userPassword,
      role: "USER",
    },
  });
}

main()
  .catch((e) => {
    console.error("Seed unsuccessful:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
