import { prisma } from "config/prisma";
import { publisher } from "config/redis.config";
import { EventAttendanceRepository } from "repositories";

const publishEvent = (channel: string, event: string, payload: any) =>
  publisher.publish(channel, JSON.stringify({ event, payload }));

export class EventAttendanceServices {
  private attendanceRepository = new EventAttendanceRepository();

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

      publishEvent("event-attendance", "user:checkin", {
        userId,
        eventId,
      });

      return attendance;
    });
  }
}
