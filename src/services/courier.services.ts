import { prisma } from "config/prisma";
import { CourierRepository, DeliveryRepository } from "repositories";

const courierRepo = new CourierRepository();
const deliveryRepo = new DeliveryRepository();

export class CourierService {
  async assignDelivery(deliveryId: string) {
    return prisma.$transaction(async (tx) => {
      await deliveryRepo.lockDelivery(deliveryId);

      const delivery = await deliveryRepo.findById(deliveryId, tx);

      if (!delivery) throw new Error("Delivery not found");

      if (delivery.status !== "PENDING") {
        // worker
        return;
      }

      const couriers = await courierRepo.findAvailableCouriers(10);

      if (!couriers.length) {
        throw new Error("No available couriers");
      }

      for (const courier of couriers) {
        try {
          await courierRepo.lockCourier(courier.id);

          // cek ulang status
          const freshCourier = await courierRepo.findById(courier.id, tx);

          if (!freshCourier || freshCourier.status !== "ONLINE") {
            continue;
          }

          await deliveryRepo.assignCourier(delivery.id, courier.id, tx);

          await courierRepo.assignCourier(courier.id, tx);

          return {
            success: true,
            courierId: courier.id,
          };
        } catch (err) {
          // gagal lock / assign - coba courier lain
          continue;
        }
      }

      throw new Error("Failed to assign courier");
    });
  }
}
