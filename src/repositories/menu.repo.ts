import { Menu, Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class MenuRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }
  // find all menus
  async findAllMenus(): Promise<Menu[]> {
    return prisma.menu.findMany({
      include: {
        venue: true,
      },
    });
  }

  // find all menus at venue
  async findMenuByVenueId(venueId: string): Promise<Menu[]> {
    return prisma.menu.findMany({ where: { venueId } });
  }

  // find detail menu
  async findMenuById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Menu | null> {
    const client = this.transaction(tx);

    return client.menu.findUnique({ where: { id } });
  }

  async findMenuByIds(
    ids: string[],
    tx?: Prisma.TransactionClient,
  ): Promise<Menu[]> {
    const client = this.transaction(tx);

    return client.menu.findMany({ where: { id: { in: ids } } });
  }

  //   create new menu at venue
  async createNewMenu(
    data: {
      name: string;
      price: number;
      category: string;
      venueId: string;
      image: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? prisma;
    return await db.menu.create({
      data: data,
    });
  }

  async createManyMenus(
    venueId: string,
    items: Array<{
      name: string;
      price: number;
      category: string;
      image: string;
    }>,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? prisma;

    const data = items.map((item) => ({
      ...item,
      venueId,
    }));

    return await db.menu.createMany({
      data: data,
      skipDuplicates: true,
    });
  }

  // update menu
  async updateMenu(id: string, data: Partial<Menu>): Promise<Menu> {
    return prisma.menu.update({ where: { id: id }, data });
  }

  // delete menu
  async deleteMenu(id: string): Promise<Menu> {
    return prisma.menu.delete({ where: { id: id } });
  }

  async getMostPopularMenus(limit = 10, tx?: Prisma.TransactionClient) {
    const client = this.transaction(tx);

    const grouped = await client.orderItem.groupBy({
      by: ["menuId"],
      _sum: {
        quantity: true,
        price: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: limit,
    });

    const menus = await client.menu.findMany({
      where: {
        id: {
          in: grouped.map((g) => g.menuId),
        },
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    const menuMap = new Map(menus.map((m) => [m.id, m]));

    return grouped.map((g) => {
      const menu = menuMap.get(g.menuId);

      return {
        menuId: g.menuId,
        menuName: menu?.name,
        venueName: menu?.venue?.name,
        totalSold: g._sum.quantity ?? 0,
        totalOrders: g._count.id,
        revenue: g._sum.price ?? 0,
      };
    });
  }

  async getMostPopularMenusByVenue(venueId: string, limit = 5) {
    const grouped = await prisma.orderItem.groupBy({
      by: ["menuId"],
      where: {
        order: {
          venueId,
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: limit,
    });

    const menus = await prisma.menu.findMany({
      where: {
        id: {
          in: grouped.map((g) => g.menuId),
        },
      },
    });

    const menuMap = new Map(menus.map((m) => [m.id, m]));

    return grouped.map((g) => {
      const menu = menuMap.get(g.menuId);

      return {
        menuId: g.menuId,
        name: menu?.name,
        totalSold: g._sum.quantity ?? 0,
      };
    });
  }
}
