import { Menu, Notification, PrismaClient } from "@prisma/client";
import {
  MenuRepository,
  VenueRepository,
  UserRepository,
  NotificationRepository,
  VenueServiceRepository,
} from "./../repositories";
import { publisher } from "config/redis.config";
import { uploadToCloudinary } from "utils/image";
import { NotificationService } from "./notification.services";
import { error, success } from "helpers/return";
import { uploadImage } from "utils/uploadS3";
const prisma = new PrismaClient();

const menuRepository = new MenuRepository();
const venueRepository = new VenueRepository();
const venueServiceRepository = new VenueServiceRepository();
const userRepository = new UserRepository();
const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService();

export class MenuServices {
  async createMenu(
    data: {
      name: string;
      price: number | string;
      category: string;
      venueId: string;
    },
    file: Express.Multer.File,
  ) {
    let imageUrl: string | null = null;

    if (file) {
      const image = await uploadImage({ file, folder: "menus" });
      imageUrl = image.url;
    }

    const service = await venueServiceRepository.findById(data.venueId);

    const price =
      typeof data.price === "string" ? parseFloat(data.price) : data.price;

    const result = await prisma.$transaction(async (tx) => {
      const menu = await menuRepository.createNewMenuByService(
        {
          name: data.name,
          category: data.category,
          venueId: data.venueId,
          price,
          image: imageUrl,
        },
        tx,
      );

      const notification = await notificationRepository.createNewNotification({
        title: "New Menu Release!",
        message: `${menu.name} has been added to ${service.venue.name}`,
        type: "Information",
        image: imageUrl || "",
        isGlobal: true,
      } as Notification);

      const users = await userRepository.findManyUsers(tx);

      await Promise.all(
        users.map((user) =>
          notificationService.sendToUser(
            service.venue.id,
            user.id,
            "New Menu Release!",
            `${menu.name} has been added to ${service.venue.name}`,
            imageUrl,
          ),
        ),
      );

      return { menu, notification };
    });

    await publisher.publish(
      "notification-events",
      JSON.stringify({
        event: "notification:updated",
        payload: result.notification,
      }),
    );
    return result;
  }

  async getMenuByVenueId(venueId: string) {
    const menus = await menuRepository.findMenuByVenueId(venueId);
    return menus;
  }

  async getMenuById(id: string) {
    const existing = await menuRepository.findMenuById(id);

    if (!existing) {
      throw new Error("Menu not found");
    }

    return existing;
  }

  async updateMenu(id: string, data: Menu, file: Express.Multer.File) {
    let imageUrl: string | null = null;

    if (file) {
      const image = await uploadImage({ file, folder: "menus" });
      imageUrl = image.url;
    }
    const existing = await menuRepository.findMenuById(id);

    if (!existing) {
      throw new Error("Menu not found");
    }

    if (imageUrl) {
      data.image = imageUrl;
    }

    const updated = await menuRepository.updateMenu(id, {
      ...data,
      image: imageUrl,
    });

    return updated;
  }

  async deleteMenu(id: string) {
    const existing = await menuRepository.findMenuById(id);

    if (!existing) {
      throw new Error("Menu not found");
    }

    const deleted = await menuRepository.deleteMenu(id);

    return deleted;
  }

  async getAllMenus() {
    const menus = await menuRepository.findAllMenus();

    if (menus.length < 1) {
      throw new Error("Menus not found");
    }

    return menus;
  }
}
