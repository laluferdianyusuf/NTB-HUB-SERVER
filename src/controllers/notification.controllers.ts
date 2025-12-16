import { Request, Response } from "express";
import { Server } from "socket.io";
import { NotificationService } from "../services/notification.services";

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async createNotification(req: Request, res: Response) {
    const result = await this.notificationService.sendNotification(
      req.body,
      req.file
    );

    res.status(result.status_code).json(result);
  }

  async getNotification(req: Request, res: Response) {
    const userId = req.user?.id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await this.notificationService.getUserNotifications(
      userId,
      page,
      limit
    );

    res.status(result.status_code).json(result);
  }

  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const result = await this.notificationService.markAllAsRead(userId);

      return res.status(200).json(result);
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  }

  async markAllAsUnread(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const result = await this.notificationService.markAllAsUnread(userId);

      return res.status(200).json(result);
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  }

  async getGroupedNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const result = await this.notificationService.getGroupedNotifications(
        userId
      );

      res.status(200).json(result);
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: false,
        message: "Internal server error",
        data: null,
      });
    }
  }

  async getNotificationByVenue(req: Request, res: Response) {
    try {
      const venueId = req.venue?.id;

      const result = await this.notificationService.getNotificationByVenue(
        venueId
      );

      res.status(200).json(result);
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: false,
        message: "Internal server error",
        data: null,
      });
    }
  }
}
