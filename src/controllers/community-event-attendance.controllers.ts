import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { CommunityEventAttendanceServices } from "services";

export class CommunityEventAttendanceControllers {
  private attendanceService = new CommunityEventAttendanceServices();

  async checkIn(req: Request, res: Response) {
    try {
      const userId = req.user?.id as string;
      const { eventId } = req.params;

      const result = await this.attendanceService.checkIn(userId, eventId);
      sendSuccess(res, result, "Checked in to this event", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
