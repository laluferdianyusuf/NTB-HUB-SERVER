import { LogRepository } from "repositories";
const logRepository = new LogRepository();

export class LogServices {
  async getAllLogs() {
    const logs = await logRepository.findAll();

    return { logs };
  }

  async findLogByUserId(userId: string) {
    const logs = await logRepository.findByUserId(userId);
    return { logs };
  }
}
