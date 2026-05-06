import { ActivityLogRepository } from "repositories";
const logRepository = new ActivityLogRepository();

export class LogServices {
  async getAllLogs() {
    const logs = await logRepository.findAll();

    return { logs };
  }
}
