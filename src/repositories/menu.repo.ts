import { Prisma, PrismaClient, Menu as PrismaMenus } from "@prisma/client";
import { Menu } from "../../models/menu.model";

const prisma = new PrismaClient();

export class MenuRepository {
  // find all menus at venue
  async findMenuByVenueId(venueId: string): Promise<PrismaMenus[]> {
    return prisma.menu.findMany({ where: { venueId } });
  }

  // find detail menu
  async findMenuById(id: string): Promise<PrismaMenus | null> {
    return prisma.menu.findUnique({ where: { id } });
  }

  //   create new menu at venue
  async createNewMenuByVenue(
    data: Menu,
    venueId: string,
    tx?: Prisma.TransactionClient
  ) {
    const db = tx ?? prisma;
    return await db.menu.create({
      data: { ...data, venueId },
    });
  }

  // update menu
  async updateMenu(id: string, data: Partial<Menu>): Promise<PrismaMenus> {
    return prisma.menu.update({ where: { id: id }, data });
  }

  // delete menu
  async deleteMenu(id: string): Promise<PrismaMenus> {
    return prisma.menu.delete({ where: { id: id } });
  }
}
