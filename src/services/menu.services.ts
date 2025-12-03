import { Menu, PrismaClient } from "@prisma/client";
import {
  MenuRepository,
  VenueRepository,
  UserRepository,
  NotificationRepository,
} from "./../repositories";
import { publisher } from "config/redis.config";
import { uploadToCloudinary } from "utils/image";
import { NotificationService } from "./notification.services";
const prisma = new PrismaClient();

const menuRepository = new MenuRepository();
const venueRepository = new VenueRepository();
const userRepository = new UserRepository();
const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService();

export class MenuServices {
  async createMenu(data: Menu, venueId: string, file: Express.Multer.File) {
    try {
      let imageUrl: string | null = null;

      if (file && file.path) {
        imageUrl = await uploadToCloudinary(file.path, "menus");
      }

      const venue = await venueRepository.findVenueById(venueId);

      if (!venue) {
        return {
          status: false,
          status_code: 404,
          message: "Venue not found",
          data: null,
        };
      }

      const result = await prisma.$transaction(async (tx) => {
        const menu = await menuRepository.createNewMenuByVenue(
          { ...data, price: parseFloat(data.price as any), image: imageUrl },
          venueId,
          tx
        );
        const users = await userRepository.findManyUsers(tx);

        const notifications = users.map((user) => ({
          userId: user.id,
          title: "New Menu Release!",
          message: `${menu.name} has been added to ${venue.name}`,
          type: "menu",
          image: imageUrl || "",
        }));

        const notification =
          await notificationRepository.createManyNotification(
            notifications,
            tx
          );
        console.log(imageUrl);

        await Promise.all(
          users.map((user) =>
            notificationService.sendToUser(
              venueId,
              user.id,
              "New Menu Release!",
              `${menu.name} has been added to ${venue.name}`,
              imageUrl
            )
          )
        );
        return { notification };
      });

      await publisher.publish(
        "notification-events",
        JSON.stringify({
          event: "notification:updated",
          payload: result.notification,
        })
      );
      return {
        status: true,
        status_code: 201,
        message: "Menu created successfully",
        data: result,
      };
    } catch (error) {
      console.log(error);

      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async getMenuByVenueId(venueId: string) {
    try {
      const menus = await menuRepository.findMenuByVenueId(venueId);
      return {
        status: true,
        status_code: 200,
        message: "Menus retrieved",
        data: menus,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async getMenuById(id: string) {
    try {
      const existing = await menuRepository.findMenuById(id);

      if (!existing) {
        return {
          status: false,
          status_code: 404,
          message: "Menu not found",
          data: null,
        };
      }

      return {
        status: true,
        status_code: 200,
        message: "Menu founded",
        data: existing,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async updateMenu(id: string, data: Menu, file: Express.Multer.File) {
    try {
      let imageUrl: string | null = null;

      if (file && file.path) {
        imageUrl = await uploadToCloudinary(file.path, "menus");
      }
      const existing = await menuRepository.findMenuById(id);

      if (!existing) {
        return {
          status: false,
          status_code: 404,
          message: "Menu not found",
          data: null,
        };
      }

      if (imageUrl) {
        data.image = imageUrl;
      }

      const updated = await menuRepository.updateMenu(id, {
        ...data,
        image: imageUrl,
      });

      return {
        status: true,
        status_code: 200,
        message: "Menu updated",
        data: updated,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async deleteMenu(id: string) {
    try {
      const existing = await menuRepository.findMenuById(id);

      if (!existing) {
        return {
          status: false,
          status_code: 404,
          message: "Menu not found",
          data: null,
        };
      }

      const deleted = await menuRepository.deleteMenu(id);

      return {
        status: true,
        status_code: 200,
        message: "Menu deleted",
        data: deleted,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }
}
