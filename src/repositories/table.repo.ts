import { Prisma, PrismaClient, Table, TableStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class TableRepository {
  // find all tables at floor
  async findTablesByFloor(floorId: string): Promise<Table[]> {
    return prisma.table.findMany({ where: { floorId } });
  }

  // find detail tables
  async findTablesById(id: string): Promise<Table | null> {
    return prisma.table.findUnique({ where: { id } });
  }

  //   create new table at floor
  async createNewTableByFloor(data: Table, floorId: string): Promise<Table> {
    return prisma.table.create({
      data: { ...data, floorId },
    });
  }

  // update table
  async updateTable(id: string, data: Partial<Table>): Promise<Table> {
    return prisma.table.update({ where: { id: id }, data });
  }

  async updateTableStatus(
    id: string,
    status: TableStatus,
    tx: Prisma.TransactionClient
  ): Promise<Table> {
    return tx.table.update({ where: { id: id }, data: { status } });
  }

  // delete table
  async deleteTable(id: string): Promise<Table> {
    return prisma.table.delete({ where: { id: id } });
  }
}
