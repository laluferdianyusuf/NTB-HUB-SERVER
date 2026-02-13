import { Prisma, PrismaClient, Menu } from "@prisma/client";

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

  //   create new menu at venue
  async createNewMenuByService(
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

  // update menu
  async updateMenu(id: string, data: Partial<Menu>): Promise<Menu> {
    return prisma.menu.update({ where: { id: id }, data });
  }

  // delete menu
  async deleteMenu(id: string): Promise<Menu> {
    return prisma.menu.delete({ where: { id: id } });
  }
}
