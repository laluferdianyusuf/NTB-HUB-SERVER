import { Menu, Notification, PrismaClient, Promotion } from "@prisma/client";
import { PromotionCache } from "cache/promotion.cache";
import { publisher } from "config/redis.config";
import { uploadImage } from "utils/uploadS3";
import {
  MenuRepository,
  NotificationRepository,
  PromotionItemRepository,
  PromotionRepository,
  UserRepository,
  VenueRepository,
} from "./../repositories";
import { NotificationService } from "./notification.services";
const prisma = new PrismaClient();

const menuRepository = new MenuRepository();
const venueRepository = new VenueRepository();
const userRepository = new UserRepository();
const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService();
const promotionRepository = new PromotionRepository();
const promotionItemRepository = new PromotionItemRepository();

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

    const venue = await venueRepository.findVenueById(data.venueId);

    const price =
      typeof data.price === "string" ? parseFloat(data.price) : data.price;

    const result = await prisma.$transaction(async (tx) => {
      const menu = await menuRepository.createNewMenu(
        {
          name: data.name,
          category: data.category,
          venueId: data.venueId,
          price,
          image: imageUrl as string,
        },
        tx,
      );

      const notification = await notificationRepository.createNewNotification({
        title: "New Menu Release!",
        message: `${menu.name} has been added to ${venue?.name ?? "venue"}`,
        type: "Information",
        image: imageUrl || "",
        isGlobal: true,
      } as Notification);

      const users = await userRepository.findManyUsers(tx);

      await Promise.all(
        users.map((user) =>
          notificationService.sendToUser(
            venue?.id as string,
            user.id,
            "New Menu Release!",
            `${menu.name} has been added to ${venue?.name}`,
            imageUrl as string,
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

  async createManyMenus(
    venueId: string,
    items: Array<{
      name: string;
      price: number | string;
      category: string;
    }>,
    files: Express.Multer.File[],
  ) {
    const venue = await venueRepository.findVenueById(venueId);

    if (!venue) {
      throw new Error("Venue not found");
    }

    if (items.length !== files.length) {
      throw new Error("Items and images count must match");
    }

    const menusData = await Promise.all(
      items.map(async (item, index) => {
        const file = files[index];

        let imageUrl: string | null = null;

        if (file) {
          const image = await uploadImage({
            file,
            folder: "menus",
          });

          imageUrl = image.url;
        }

        const price =
          typeof item.price === "string" ? parseFloat(item.price) : item.price;

        return {
          name: item.name,
          category: item.category,
          venueId,
          price,
          image: imageUrl as string,
        };
      }),
    );

    await prisma.$transaction(async (tx) => {
      await menuRepository.createManyMenus(venueId, menusData, tx);
    });

    return menusData;
  }

  async getMenuByVenueId(venueId: string) {
    const menus = await menuRepository.findMenuByVenueId(venueId);

    if (!menus.length) return [];

    let promotions = await PromotionCache.getVenuePromos(venueId);

    if (!promotions) {
      promotions = await promotionRepository.findActiveByVenue(
        venueId,
        new Date(),
      );

      await PromotionCache.setVenuePromos(venueId, promotions);
    }

    const promoMenuMap = new Map<string, any>();

    for (const promo of promotions) {
      const items = await promotionItemRepository.findByPromotion({
        promotionId: promo.id,
      });

      for (const item of items) {
        promoMenuMap.set(item.menuId as string, promo);
      }
    }

    const result = menus.map((menu) => {
      const promo: Promotion = promoMenuMap.get(menu.id);

      if (!promo) {
        return {
          id: menu.id,
          name: menu.name,
          image: menu.image,
          price: Number(menu.price),
          discount: 0,
          finalPrice: Number(menu.price),
          promotionId: null,
          isAvailable: menu.isAvailable,
          category: menu.category,
        };
      }

      const discount =
        promo.discountType === "PERCENT"
          ? Number(menu.price) * (Number(promo.discountValue) / 100)
          : Number(promo.discountValue);

      return {
        id: menu.id,
        name: menu.name,
        image: menu.image,
        price: Number(menu.price),
        discount,
        finalPrice: Number(menu.price) - discount,
        promotionId: promo.id,
      };
    });

    return result;
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

  async getMostPopularMenus(limit = 10) {
    const menus = await menuRepository.getMostPopularMenus(limit);

    if (!menus.length) {
      throw new Error("Popular menus not found");
    }

    return menus;
  }

  async toggleMenuStatus(menuId: string): Promise<{
    message: string;
    data: Menu;
  }> {
    const menu = await menuRepository.findMenuById(menuId);

    if (!menu) {
      throw new Error("Menu not found");
    }

    const updatedMenu = await menuRepository.toggleMenuStatus(menuId);

    return {
      message: updatedMenu.isAvailable
        ? "Menu activated successfully"
        : "Menu deactivated successfully",
      data: updatedMenu,
    };
  }
}
