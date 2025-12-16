import { DeviceService } from "services";
import { Request, Response } from "express";

export class DeviceController {
  private service = new DeviceService();

  async registerDevice(req: Request, res: Response) {
    const result = await this.service.registerDevice(req.body);
    res.status(result.status ? 200 : 400).json(result);
  }

  async getUserDevices(req: Request, res: Response) {
    const result = await this.service.getUserDevices(req.params.userId);
    res.json(result);
  }
}
