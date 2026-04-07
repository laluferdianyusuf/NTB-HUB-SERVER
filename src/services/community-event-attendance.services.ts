import { prisma } from "config/prisma";
import { publisher } from "config/redis.config";
import {
  CommunityEventAttendanceRepository,
  PointsRepository,
  TaskExecutionRepository,
  TaskRepository,
} from "repositories";
import { TaskRule } from "types/task";

const publishEvent = (channel: string, event: string, payload: any) =>
  publisher.publish(channel, JSON.stringify({ event, payload }));

export class CommunityEventAttendanceServices {
  private attendanceRepository = new CommunityEventAttendanceRepository();
  private taskRepository = new TaskRepository();
  private taskExecRepository = new TaskExecutionRepository();
  private pointRepository = new PointsRepository();

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

      const task = await this.taskRepository.findByEntity(
        "EVENT",
        attendance.id,
        "CHECK_IN",
        tx,
      );

      if (task) {
        const rule = task.rule as TaskRule;
        const reward = rule.reward?.points ?? 0;

        const existingExecution =
          await this.taskExecRepository.findUserExecution(task.id, userId, tx);

        if (!existingExecution) {
          const execution = await this.taskExecRepository.create(
            {
              taskId: task.id,
              userId,
            },
            tx,
          );

          await this.taskExecRepository.complete(execution.id, tx);

          if (reward > 0) {
            await this.pointRepository.generatePoints(
              {
                userId,
                activity: "CHECK_IN",
                points: reward,
                reference: attendance.id,
              },
              tx,
            );
          }
        }
      }

      publishEvent("community-event-attendance", "user:checkin", {
        userId,
        eventId,
      });

      return attendance;
    });
  }
}
