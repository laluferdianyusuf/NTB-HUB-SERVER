import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

async function main() {
  // Buat admin default
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

  // Ambil semua venue
  const venues = await prisma.venue.findMany();

  if (venues.length === 0) {
    console.log("Tidak ada venue. Skip seeding operational hours.");
    return;
  }

  const defaultOpen = new Date("1970-01-01T09:00:00.000Z");
  const defaultClose = new Date("1970-01-01T17:00:00.000Z");

  for (const venue of venues) {
    const existingHours = await prisma.operationalHour.findMany({
      where: { venueId: venue.id },
    });

    if (existingHours.length === 0) {
      const ops = Array.from({ length: 7 }).map((_, day) => ({
        venueId: venue.id,
        dayOfWeek: day,
        opensAt: defaultOpen,
        closesAt: defaultClose,
      }));

      await prisma.operationalHour.createMany({ data: ops });

      console.log(
        `✔ Venue "${venue.name}" sudah ditambahkan jam operasional default.`
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
