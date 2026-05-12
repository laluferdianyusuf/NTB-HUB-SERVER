import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

async function main() {
  // const venues = await prisma.venue.findMany();

  // if (venues.length === 0) {
  //   console.log("No venues. Skip seeding operational hours.");
  //   return;
  // }

  // const DEFAULT_OPEN_HOUR = 9; // 09:00
  // const DEFAULT_CLOSE_HOUR = 17; // 17:00

  // for (const venue of venues) {
  //   const existingHours = await prisma.operationalHour.findMany({
  //     where: { venueId: venue.id },
  //   });

  //   if (existingHours.length === 0) {
  //     const ops = Array.from({ length: 7 }).map((_, day) => ({
  //       venueId: venue.id,
  //       dayOfWeek: day,
  //       opensAt: DEFAULT_OPEN_HOUR,
  //       closesAt: DEFAULT_CLOSE_HOUR,
  //     }));

  //     await prisma.operationalHour.createMany({
  //       data: ops,
  //     });

  //     console.log(
  //       `Venue "${venue.name}" sudah ditambahkan jam operasional default (${DEFAULT_OPEN_HOUR}:00 - ${DEFAULT_CLOSE_HOUR}:00).`,
  //     );
  //   }
  // }

  const interests = [
    {
      name: "Caffe & Resto",
      color: "#FF6B6B",
    },
    {
      name: "Sport",
      color: "#6BCB77",
    },
    {
      name: "Entertainment",
      color: "#A259FF",
    },
    {
      name: "Food",
      color: "#FF9F1C",
    },
    {
      name: "Shopping",
      color: "#00B4D8",
    },
    {
      name: "Hotel",
      color: "#9B5DE5",
    },
    {
      name: "Travel",
      color: "#F15BB5",
    },
    {
      name: "Health",
      color: "#00F5D4",
    },
    {
      name: "Education",
      color: "#FFC300",
    },
    {
      name: "Technology",
      color: "#FF5733",
    },
  ];

  for (const interest of interests) {
    await prisma.interest.upsert({
      where: {
        name: interest.name,
      },
      update: {},
      create: interest,
    });
  }

  await prisma.platformBalance.upsert({
    where: { id: "platform-balance" },
    update: {},
    create: {
      id: "platform-balance",
      balance: 0,
    },
  });

  await prisma.account.upsert({
    where: { id: "platform-main-account" },
    update: {},
    create: {
      type: "PLATFORM",
      id: "platform-main-account",
      isPlatform: true,
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
