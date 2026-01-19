import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@billiard.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@billiard.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const venues = await prisma.venue.findMany();

  if (venues.length === 0) {
    console.log("No venues. Skip seeding operational hours.");
    return;
  }

  const DEFAULT_OPEN_HOUR = 9; // 09:00
  const DEFAULT_CLOSE_HOUR = 17; // 17:00

  for (const venue of venues) {
    const existingHours = await prisma.operationalHour.findMany({
      where: { venueId: venue.id },
    });

    if (existingHours.length === 0) {
      const ops = Array.from({ length: 7 }).map((_, day) => ({
        venueId: venue.id,
        dayOfWeek: day,
        opensAt: DEFAULT_OPEN_HOUR,
        closesAt: DEFAULT_CLOSE_HOUR,
      }));

      await prisma.operationalHour.createMany({
        data: ops,
      });

      console.log(
        `✔ Venue "${venue.name}" sudah ditambahkan jam operasional default (${DEFAULT_OPEN_HOUR}:00 - ${DEFAULT_CLOSE_HOUR}:00).`,
      );
    }
  }

  await prisma.platformBalance.upsert({
    where: { id: "platform-balance" },
    update: {},
    create: {
      id: "platform-balance",
      balance: 0,
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
