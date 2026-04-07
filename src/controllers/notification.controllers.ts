import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { NotificationService } from "../services/notification.services";

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async createNotification(req: Request, res: Response) {
    const result = await this.notificationService.sendNotification(
      req.body,
      req.file,
    );

    sendSuccess(res, result, "Notification Created", 201);
  }

  async getNotification(req: Request, res: Response) {
    try {
      const userId = req.user?.id as string;

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.notificationService.getUserNotifications(
        userId,
        page,
        limit,
      );

      sendSuccess(res, result, "Notification Retrieved");
    } catch (error: any) {
      console.log(error);

      sendError(res, error.message || "Internal server error");
    }
  }

  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id as string;

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
      const userId = req.user?.id as string;

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
      const userId = req.user?.id as string;

      const result =
        await this.notificationService.getGroupedNotifications(userId);

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
      const venueId = req.params.venueId;

      const result =
        await this.notificationService.getNotificationByVenue(venueId);

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
