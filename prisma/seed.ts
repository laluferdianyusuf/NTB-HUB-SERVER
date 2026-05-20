import { prisma } from "../src/config/prisma";
import { categories } from "../src/utils/categories";

async function main() {
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

  for (const category of categories) {
    await prisma.venueCategory.upsert({
      where: {
        id: category.id,
      },
      update: {
        name: category.name,
        code: category.code,
        icon: category.icon,
        isActive: category.isActive,
      },
      create: {
        id: category.id,
        name: category.name,
        code: category.code,
        icon: category.icon,
        isActive: category.isActive,
      },
    });

    for (const subCategory of category.subCategories) {
      await prisma.venueSubCategory.upsert({
        where: {
          id: subCategory.id,
        },
        update: {
          name: subCategory.name,
          code: subCategory.code,
          description: subCategory.description,
          defaultConfig: subCategory.defaultConfig,
          isActive: true,
          categoryId: category.id,
        },
        create: {
          id: subCategory.id,
          categoryId: category.id,
          name: subCategory.name,
          code: subCategory.code,
          description: subCategory.description,
          defaultConfig: subCategory.defaultConfig,
          isActive: true,
        },
      });
    }
  }

  console.log("Categories & SubCategories seeded");
}

main()
  .catch((e) => {
    console.error("Seed unsuccessful:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
