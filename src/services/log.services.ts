import { LogRepository } from "repositories";
const logRepository = new LogRepository();

export class LogServices {
  async getAllLogs() {
    try {
      const logs = await logRepository.findAll();

      return {
        status: true,
        status_code: 200,
        message: "Logs retrieved successfully",
        data: logs,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Error retrieving logs",
        data: null,
      };
    }
  }

  async findLogByUserId(userId: string) {
    try {
      const logs = await logRepository.findByUserId(userId);
      return {
        status: true,
        status_code: 200,
        message: "Logs retrieved successfully",
        data: logs,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Error retrieving logs by user ID",
        data: null,
      };
    }
  }
}
