import { LogServices } from "services";

export class LogController {
  private logServices: LogServices;

  constructor() {
    this.logServices = new LogServices();
  }

  async getAllLogs(req: any, res: any) {
    const response = await this.logServices.getAllLogs();
    res.status(response.status_code).json(response);
  }

  async findLogByUserId(req: any, res: any) {
    const userId = req.params.userId;
    const response = await this.logServices.findLogByUserId(userId);
    res.status(response.status_code).json(response);
  }
}
