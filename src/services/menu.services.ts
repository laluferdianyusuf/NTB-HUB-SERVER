import { Menu } from "@prisma/client";
import { MenuRepository } from "./../repositories/menu.repo";

const menuRepository = new MenuRepository();

export class MenuServices {
  async createMenu(data: Menu, venueId: string) {
    try {
      const created = await menuRepository.createNewMenuByVenue(data, venueId);
      return {
        status: true,
        status_code: 201,
        message: "Menu created successfully",
        data: created,
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

  async updateMenu(id: string, data: Menu) {
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

      const updated = await menuRepository.updateMenu(id, data);

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
