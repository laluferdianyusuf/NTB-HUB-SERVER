import { Booking, PrismaClient, Review } from "@prisma/client";
const prisma = new PrismaClient();

export class ReviewRepository {
  async create(data: Review, userId: string): Promise<Review> {
    return await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({ data });

      await tx.point.create({
        data: {
          userId: userId,
          points: 10,
          activity: "REVIEW",
          reference: review.id,
        },
      });
      return review;
    });
  }

  async findById(id: string): Promise<Review | null> {
    return prisma.review.findUnique({ where: { id } });
  }

  async findAll(): Promise<Review[]> {
    return prisma.review.findMany();
  }

  async findByBookingId(bookingId: string): Promise<Review | null> {
    return prisma.review.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                photo: true,
              },
            },
          },
        },
      },
    });
  }

  async findManyByVenueId(venueId: string): Promise<Review[]> {
    return prisma.review.findMany({
      where: {
        booking: {
          venueId,
        },
      },
      include: {
        booking: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                photo: true,
              },
            },
          },
        },
      },
    });
  }
}
