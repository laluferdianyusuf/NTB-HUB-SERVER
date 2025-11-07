import { Request, Response } from "express";
import { Server } from "socket.io";
import { NotificationService } from "../services/notification.services";

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async createNotification(req: Request, res: Response) {
    const result = await this.notificationService.sendNotification(req.body);

    res.status(result.status_code).json(result);
  }

  async getNotification(req: Request, res: Response) {
    const { userId } = req.params;
    const result = await this.notificationService.getUserNotifications(userId);
    res.status(result.status_code).json(result);
  }

  async markRead(req: Request, res: Response) {
    const { id } = req.params;

    const result = await this.notificationService.markAsRead(id);
    res.status(result.status_code).json(result);
  }
}
