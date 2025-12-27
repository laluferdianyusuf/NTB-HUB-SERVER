import {
  BookingStatus,
  Prisma,
  PrismaClient,
  Table,
  TableStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

export class TableRepository {
  // find all tables at floor
  async findTablesByFloor(floorId: string, venueId: string): Promise<Table[]> {
    return prisma.table.findMany({
      where: { floorId, venueId },
      include: {
        bookings: {
          include: {
            invoice: true,
          },
        },
      },
      orderBy: { tableNumber: "asc" },
    });
  }

  // find detail tables
  async findTablesById(id: string): Promise<Table | null> {
    return prisma.table.findUnique({ where: { id } });
  }

  // find detail tables
  async findTablesByNumber(number: number): Promise<Table | null> {
    return prisma.table.findFirst({ where: { tableNumber: number } });
  }

  //   create new table at floor
  async createNewTableByFloor(data: Table): Promise<Table> {
    return prisma.table.create({
      data: data,
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

  async isTableBookedNow(tableId: string, now = new Date()) {
    const active = await prisma.booking.findFirst({
      where: {
        tableId,
        status: BookingStatus.PAID,
        startTime: { lte: now },
        endTime: { gt: now },
      },
      select: { id: true },
    });

    return !!active;
  }

  async getTableStatus(tableId: string, now = new Date()) {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: { status: true },
    });

    if (!table) throw new Error("Table not found");

    if (table.status === TableStatus.MAINTENANCE)
      return TableStatus.MAINTENANCE;

    const booked = await this.isTableBookedNow(tableId, now);
    return booked ? "BOOKED" : "AVAILABLE";
  }

  async findAvailableTables(
    venueId: string,
    floorId: string,
    startTime: Date,
    endTime: Date
  ) {
    return prisma.table.findMany({
      where: {
        venueId,
        floorId,
        status: { not: "MAINTENANCE" },
      },
      include: {
        bookings: {
          where: {
            status: { in: ["PAID", "PENDING"] },
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        },
      },
    });
  }
}
