import { Prisma, PrismaClient, Menu } from "@prisma/client";

const prisma = new PrismaClient();

export class MenuRepository {
  // find all menus
  async findAllMenus(): Promise<Menu[]> {
    return prisma.menu.findMany({
      include: {
        service: {
          select: {
            venue: true,
          },
        },
      },
    });
  }

  // find all menus at service
  async findMenuByServiceId(serviceId: string): Promise<Menu[]> {
    return prisma.menu.findMany({ where: { serviceId } });
  }

  // find detail menu
  async findMenuById(id: string): Promise<Menu | null> {
    return prisma.menu.findUnique({ where: { id } });
  }

  //   create new menu at venue
  async createNewMenuByService(
    data: {
      name: string;
      price: number;
      category: string;
      serviceId: string;
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
