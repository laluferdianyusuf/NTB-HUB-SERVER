import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { DeviceService } from "services";

export class DeviceController {
  private service = new DeviceService();

  async registerDevice(req: Request, res: Response) {
    try {
      const result = await this.service.registerDevice(req.body);

      sendSuccess(res, result, "Device registered", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async getUserDevices(req: Request, res: Response) {
    try {
      const result = await this.service.getUserDevices(req.params.userId);
      sendSuccess(res, result, "Device retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
