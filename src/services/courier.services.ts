import { prisma } from "config/prisma";
import { dispatchAssignDelivery } from "queue/dispatch";
import { CourierRepository, DeliveryRepository } from "repositories";
import {
  filterAvailableCouriers,
  findNearestCouriers,
} from "socket/courier.socket";

const courierRepo = new CourierRepository();
const deliveryRepo = new DeliveryRepository();

const MAX_ATTEMPT = 5;

export class CourierService {
  async assignDelivery(deliveryId: string) {
    return prisma.$transaction(async (tx) => {
      const delivery = await deliveryRepo.lockDelivery(deliveryId, tx);

      if (!delivery) throw new Error("Delivery not found");

      if (delivery.status !== "PENDING") {
        return { skipped: true };
      }

      if ((delivery.attemptCount || 0) >= MAX_ATTEMPT) {
        await deliveryRepo.updateStatus(delivery.id, "CANCELLED", tx);
        return { failed: true, reason: "Max attempt reached" };
      }

      const rejectedCourierIds = await deliveryRepo.getRejectedCourierIds(
        delivery.id,
        tx,
      );

      let candidateCourierIds: string[] = [];

      if (delivery.latitude && delivery.longitude) {
        const nearbyIds = await findNearestCouriers(
          delivery.latitude,
          delivery.longitude,
          5,
          20,
        );

        const availableIds = await filterAvailableCouriers(
          nearbyIds as string[],
        );

        candidateCourierIds = availableIds.filter(
          (id) => !rejectedCourierIds.includes(id),
        );
      }

      if (!candidateCourierIds.length) {
        const fallbackCouriers =
          await courierRepo.findAvailableCouriersWithLock(
            {
              limit: 10,
              excludeIds: rejectedCourierIds,
            },
            tx,
          );

        candidateCourierIds = fallbackCouriers.map((c) => c.id);
      }

      if (!candidateCourierIds.length) {
        await deliveryRepo.incrementAttempt(delivery.id, tx);
        throw new Error("No available couriers");
      }

      const couriers = await courierRepo.findByIdsWithLockOrdered(
        candidateCourierIds,
        tx,
      );

      for (const courier of couriers) {
        if (courier.status !== "ONLINE") continue;

        try {
          await deliveryRepo.assignCourier(delivery.id, courier.id, tx);

          await courierRepo.setOnDelivery(courier.id, tx);

          await deliveryRepo.createAssignmentLog(
            {
              deliveryId: delivery.id,
              courierId: courier.id,
              status: "ASSIGNED",
            },
            tx,
          );

          await deliveryRepo.incrementAttempt(delivery.id, tx);

          await deliveryRepo.updateLastAssignedAt(delivery.id, tx);

          return {
            success: true,
            courierId: courier.id,
          };
        } catch (err) {
          continue;
        }
      }

      await deliveryRepo.incrementAttempt(delivery.id, tx);

      throw new Error("Failed to assign courier");
    });
  }

  async rejectDelivery(deliveryId: string, courierId: string) {
    return prisma.$transaction(async (tx) => {
      const delivery = await deliveryRepo.lockDelivery(deliveryId, tx);

      if (!delivery) throw new Error("Delivery not found");

      await deliveryRepo.createAssignmentLog(
        {
          deliveryId,
          courierId,
          status: "REJECTED",
        },
        tx,
      );

      await deliveryRepo.addRejectedCourier(deliveryId, courierId, tx);

      await courierRepo.setOnline(courierId, tx);

      await deliveryRepo.resetToPending(deliveryId, tx);

      await dispatchAssignDelivery(deliveryId);

      return { success: true };
    });
  }

  async handleAssignmentTimeout(deliveryId: string) {
    return prisma.$transaction(async (tx) => {
      const delivery = await deliveryRepo.lockDelivery(deliveryId, tx);

      if (!delivery) return;

      if (delivery.status !== "ASSIGNED") return;

      await deliveryRepo.createAssignmentLog(
        {
          deliveryId,
          courierId: delivery.courierId!,
          status: "TIMEOUT",
        },
        tx,
      );

      await deliveryRepo.addRejectedCourier(
        deliveryId,
        delivery.courierId!,
        tx,
      );

      await courierRepo.setOnline(delivery.courierId!, tx);

      await deliveryRepo.resetToPending(deliveryId, tx);

      return { reassign: true };
    });
  }
}
