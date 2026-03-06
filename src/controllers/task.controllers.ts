import { TaskEntityType } from "@prisma/client";
import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { TaskService } from "services";

const service = new TaskService();

export class TaskController {
  async create(req: Request, res: Response) {
    try {
      const task = await service.createTask(req.body);
      return sendSuccess(res, task, "Task created successful", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async generateQr(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const qr = await service.generateQr(taskId);
      return sendSuccess(res, qr, "Qr created", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async verify(req: Request, res: Response) {
    try {
      const userId = req.user?.id; // dari auth middleware
      const result = await service.verifyQrAndExecute({
        userId: String(userId),
        token: req.body.token,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
      });
      return sendSuccess(res, result, "Qr verified");
    } catch (error: any) {
      console.log(error);

      sendError(res, error.message || "Internal Server Error");
    }
  }

  async findAllWithStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.id as string;
      const { communityId } = req.query;

      const tasks = await service.getTasks(userId, communityId as string);

      return sendSuccess(res, tasks, "Tasks fetched successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const tasks = await service.getAllTasks();

      return sendSuccess(res, tasks, "Tasks fetched successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }
}
