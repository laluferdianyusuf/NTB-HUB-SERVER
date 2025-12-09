import { Booking, PrismaClient, Review } from "@prisma/client";
const prisma = new PrismaClient();

export class ReviewRepository {
  async create(data: Review, booking: Booking): Promise<Review> {
    return await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({ data });

      await tx.point.create({
        data: {
          userId: booking.userId,
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

  async findByBookingId(bookingId: string): Promise<Review> {
    return prisma.review.findUnique({
      where: { bookingId },
    });
  }

  async getVenueRating(venueId: string) {
    const reviews = await prisma.review.findMany({
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

    if (reviews.length === 0) {
      return {
        rating: 0,
        reviewers: [],
      };
    }

    const average =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    return {
      rating: parseFloat(average.toFixed(2)),
      reviewers: reviews,
    };
  }
}
