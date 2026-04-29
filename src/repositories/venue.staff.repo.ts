import { Prisma, PrismaClient, VenueStaff } from "@prisma/client";

const prisma = new PrismaClient();

type DB = Prisma.TransactionClient | PrismaClient;

export class VenueStaffRepository {
  private db(tx?: DB) {
    return tx || prisma;
  }

  async create(
    data: Prisma.VenueStaffCreateInput,
    tx?: DB,
  ): Promise<VenueStaff> {
    return this.db(tx).venueStaff.create({
      data,
    });
  }

  async findById(id: string, tx?: DB): Promise<VenueStaff | null> {
    return this.db(tx).venueStaff.findUnique({
      where: { id },
    });
  }

  async findByPhone(
    venueId: string,
    phone: string,
    tx?: DB,
  ): Promise<VenueStaff | null> {
    return this.db(tx).venueStaff.findFirst({
      where: {
        venueId,
        phone,
      },
    });
  }

  async update(
    id: string,
    data: Prisma.VenueStaffUpdateInput,
    tx?: DB,
  ): Promise<VenueStaff> {
    return this.db(tx).venueStaff.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tx?: DB): Promise<VenueStaff> {
    return this.db(tx).venueStaff.delete({
      where: { id },
    });
  }

  async listByVenue(
    venueId: string,
    search?: string,
    tx?: DB,
  ): Promise<VenueStaff[]> {
    return this.db(tx).venueStaff.findMany({
      where: {
        venueId,
        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: search,
              },
            },
          ],
        }),
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async paginate(
    venueId: string,
    page: number,
    limit: number,
    search?: string,
    tx?: DB,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.VenueStaffWhereInput = {
      venueId,
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: search,
            },
          },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.db(tx).venueStaff.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      this.db(tx).venueStaff.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
