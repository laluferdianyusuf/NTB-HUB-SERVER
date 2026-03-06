import { prisma } from "config/prisma";
import { publisher } from "config/redis.config";
import { CommunityEventAttendanceRepository } from "repositories";

const publishEvent = (channel: string, event: string, payload: any) =>
  publisher.publish(channel, JSON.stringify({ event, payload }));

export class CommunityEventAttendanceServices {
  private attendanceRepository = new CommunityEventAttendanceRepository();

  async checkIn(userId: string, eventId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await this.attendanceRepository.findOne(
        eventId,
        userId,
        tx,
      );

      if (existing) throw new Error("User already checked in for this event");

      const attendance = await this.attendanceRepository.attendance(
        eventId,
        userId,
        tx,
      );

      publishEvent("community-event-attendance", "user:checkin", {
        userId,
        eventId,
      });

      return attendance;
    });
  }
}
