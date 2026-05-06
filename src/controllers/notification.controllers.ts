import { NotificationRecipientType } from "@prisma/client";
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

  async getNotificationByRecipient(req: Request, res: Response) {
    try {
      const recipientId = req.user?.id as string;
      const { recipientType } = req.query;

      const result = await this.notificationService.getNotificationByRecipient(
        recipientType as NotificationRecipientType,
        recipientId,
      );

      sendSuccess(res, result, "Notification Retrieved");
    } catch (error: any) {
      console.log(error);

      sendError(res, error.message || "Internal server error");
    }
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
      const { recipientType } = req.body;

      const result = await this.notificationService.markAllAsRead(
        recipientType,
        userId,
      );

      sendSuccess(res, result, "Notification marked as read");
    } catch (error: any) {
      console.log(error);

      sendError(res, error.message || "Internal server error");
    }
  }

  async markAllAsUnread(req: Request, res: Response) {
    try {
      const userId = req.user?.id as string;
      const { recipientType } = req.body;

      const result = await this.notificationService.markAllAsUnread(
        recipientType,
        userId,
      );

      sendSuccess(res, result, "Notification marked as unread");
    } catch (error: any) {
      console.log(error);

      sendError(res, error.message || "Internal server error");
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
