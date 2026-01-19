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
      serviceId: string;
    },
    file: Express.Multer.File,
  ) {
    try {
      let imageUrl: string | null = null;

      const service = await venueServiceRepository.findById(data.serviceId);

      if (file && file.path) {
        imageUrl = await uploadToCloudinary(file.path, "menus");
      }

      const price =
        typeof data.price === "string" ? parseFloat(data.price) : data.price;

      const result = await prisma.$transaction(async (tx) => {
        const menu = await menuRepository.createNewMenuByService(
          {
            name: data.name,
            category: data.category,
            serviceId: data.serviceId,
            price,
            image: imageUrl,
          },
          tx,
        );

        const notification = await notificationRepository.createNewNotification(
          {
            title: "New Menu Release!",
            message: `${menu.name} has been added to ${service.venue.name}`,
            type: "Information",
            image: imageUrl || "",
            isGlobal: true,
          } as Notification,
        );

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

  async getMenuByServiceId(serviceId: string) {
    try {
      const menus = await menuRepository.findMenuByServiceId(serviceId);
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

  async getAllMenus() {
    try {
      const menus = await menuRepository.findAllMenus();

      if (menus.length < 1) {
        return error.error404("Menus not found");
      }

      return success.success200("Menus retrieved", menus);
    } catch (err) {
      return error.error500("Internal server error" + err);
    }
  }
}
