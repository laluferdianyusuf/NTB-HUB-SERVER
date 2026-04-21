import { Prisma } from "@prisma/client";

export class CourierRepository {
  async findById(id: string, tx: Prisma.TransactionClient) {
    return tx.courier.findUnique({
      where: { id },
    });
  }

  async findByIdsWithLockOrdered(ids: string[], tx: Prisma.TransactionClient) {
    if (!ids.length) return [];

    const rows = await tx.$queryRawUnsafe<any[]>(
      `
    SELECT * FROM "Courier"
    WHERE id = ANY($1)
    FOR UPDATE
  `,
      ids,
    );

    const map = new Map(rows.map((r) => [r.id, r]));

    return ids.map((id) => map.get(id)).filter(Boolean);
  }

  async findAvailableCouriersWithLock(
    { limit, excludeIds }: { limit: number; excludeIds: string[] },
    tx: Prisma.TransactionClient,
  ) {
    if (excludeIds.length === 0) {
      return tx.$queryRawUnsafe<any[]>(`
        SELECT * FROM "Courier"
        WHERE status = 'ONLINE'
        AND "isActive" = true
        ORDER BY rating DESC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      `);
    }

    const placeholders = excludeIds.map((_, i) => `$${i + 1}`).join(",");

    return tx.$queryRawUnsafe<any[]>(
      `
      SELECT * FROM "Courier"
      WHERE status = 'ONLINE'
      AND "isActive" = true
      AND id NOT IN (${placeholders})
      ORDER BY rating DESC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
      `,
      ...excludeIds,
    );
  }

  async setOnDelivery(id: string, tx: Prisma.TransactionClient) {
    return tx.courier.update({
      where: { id },
      data: {
        status: "ON_DELIVERY",
      },
    });
  }

  async setOnline(id: string, tx: Prisma.TransactionClient) {
    return tx.courier.update({
      where: { id },
      data: {
        status: "ONLINE",
      },
    });
  }
}
