import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

cron.schedule("0 2 * * *", async () => {
  try {
    const deleted = await prisma.locationTracking.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });
    console.log("Deleted old locations:", deleted.count);
  } catch (err) {
    console.error("Error deleting old locations:", err);
  }
});
