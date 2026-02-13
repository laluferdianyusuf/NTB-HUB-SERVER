import { nanoid } from "nanoid";
import {
  LocationRepository,
  TaskExecutionRepository,
  TaskQrRepository,
  TaskRepository,
} from "repositories";

import { TaskQrRedisService } from "./taskQrService";
import { calcDistanceMeters, detectGpsSpoof } from "helpers/geo";
import { detectTeleport } from "helpers/geoAntiFake.helper";
import { TaskAnalyticsService } from "./taskAnalytics.service";
import { PointQueueService } from "./reward.services";
import { TaskEntityType, TaskType } from "@prisma/client";

interface RewardRule {
  points: number;
}

interface BaseTaskRule {
  reward?: RewardRule;
}

interface QrTaskRule extends BaseTaskRule {}

interface GeoTaskRule extends BaseTaskRule {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

interface LocationQrTaskRule extends BaseTaskRule {
  location: {
    latitude: number;
    longitude: number;
  };
  radiusMeters: number;
}

type TaskRule = QrTaskRule | GeoTaskRule | LocationQrTaskRule;

function isGeoRule(rule: TaskRule): rule is GeoTaskRule {
  return (
    (rule as GeoTaskRule).latitude !== undefined &&
    (rule as GeoTaskRule).longitude !== undefined &&
    (rule as GeoTaskRule).radiusMeters !== undefined
  );
}

function isLocationQrRule(rule: TaskRule): rule is LocationQrTaskRule {
  return (
    typeof (rule as LocationQrTaskRule).location?.latitude === "number" &&
    typeof (rule as LocationQrTaskRule).location?.longitude === "number" &&
    typeof (rule as LocationQrTaskRule).radiusMeters === "number"
  );
}

export class TaskService {
  constructor(
    private taskRepo = new TaskRepository(),
    private qrRepo = new TaskQrRepository(),
    private execRepo = new TaskExecutionRepository(),
    private qrRedis = new TaskQrRedisService(),
    private rewardService = new PointQueueService(),
    private analytics = new TaskAnalyticsService(),
    private locationRepo = new LocationRepository(),
  ) {}

  async createTask(payload: {
    entityType: TaskEntityType;
    entityId: string;
    communityId?: string;
    title: string;
    description?: string;
    type: TaskType;
    rule: TaskRule;
    startAt?: Date;
    endAt?: Date;
  }) {
    return this.taskRepo.create(payload);
  }

  async generateQr(taskId: string) {
    const task = await this.taskRepo.findById(taskId);
    if (!task || !task.isActive) {
      throw new Error("Task not active");
    }

    const token = nanoid(32);
    const ttlSeconds = 300;

    const qr = await this.qrRepo.create(
      taskId,
      token,
      new Date(Date.now() + ttlSeconds * 1000),
    );

    await this.qrRedis.set(token, taskId, ttlSeconds);
    return qr;
  }

  async verifyQrAndExecute(params: {
    token: string;
    userId: string;
    latitude?: number;
    longitude?: number;
  }) {
    const redisTaskId = await this.qrRedis.get(params.token);
    if (!redisTaskId) throw new Error("QR expired");

    const session = await this.qrRepo.findValidSession(params.token);
    if (!session) throw new Error("QR invalid");

    if (session.taskId !== redisTaskId) {
      throw new Error("QR mismatch");
    }

    const task = session.task;
    const rule = task.rule as TaskRule;
    const now = new Date();

    if (!task.isActive) throw new Error("Task inactive");
    if (task.startAt && now < task.startAt) throw new Error("Task not started");
    if (task.endAt && now > task.endAt) throw new Error("Task expired");

    const existing = await this.execRepo.findUserExecution(
      task.id,
      params.userId,
    );
    if (existing) throw new Error("Task already completed");

    if (task.requiresGeo) {
      if (
        typeof params.latitude !== "number" ||
        typeof params.longitude !== "number"
      ) {
        throw new Error("Location required");
      }

      const lastLocation = await this.locationRepo.getLatest(params.userId);

      if (
        lastLocation &&
        detectTeleport(
          lastLocation.latitude,
          lastLocation.longitude,
          lastLocation.createdAt,
          params.latitude,
          params.longitude,
          now,
        )
      ) {
        await this.analytics.track("task_teleport_detected", {
          userId: params.userId,
          taskId: task.id,
        });

        throw new Error("Unrealistic movement detected");
      }

      if (detectGpsSpoof(params.latitude, params.longitude)) {
        await this.analytics.track("task_gps_spoof", {
          taskId: task.id,
          userId: params.userId,
        });

        throw new Error("Suspicious GPS detected");
      }

      let targetLat: number;
      let targetLng: number;
      let radius: number;

      if (isGeoRule(rule)) {
        targetLat = rule.latitude;
        targetLng = rule.longitude;
        radius = rule.radiusMeters;
      } else if (isLocationQrRule(rule)) {
        targetLat = rule.location.latitude;
        targetLng = rule.location.longitude;
        radius = rule.radiusMeters;
      } else {
        throw new Error("Invalid geo rule configuration");
      }

      const distance = calcDistanceMeters(
        targetLat,
        targetLng,
        params.latitude,
        params.longitude,
      );

      if (distance > radius) {
        throw new Error("Outside allowed area");
      }
    }

    const execution = await this.execRepo.create({
      taskId: task.id,
      userId: params.userId,
      qrSessionId: session.id,
      latitude: params.latitude,
      longitude: params.longitude,
    });

    await this.execRepo.complete(execution.id);
    await this.qrRepo.invalidate(session.id);
    await this.qrRedis.consume(params.token);

    if (
      typeof params.latitude === "number" &&
      typeof params.longitude === "number"
    ) {
      await this.locationRepo.save(
        params.userId,
        params.latitude,
        params.longitude,
      );
    }

    await this.rewardService.givePoint({
      userId: params.userId,
      activity: "ADMIN_GRANT",
      points: rule.reward?.points ?? 10,
      reference: task.id,
    });

    await this.analytics.track("task_completed", {
      taskId: task.id,
      userId: params.userId,
    });

    return execution;
  }

  async getTasks(params: { entityType?: TaskEntityType; entityId?: string }) {
    if (params.entityType && !params.entityId) {
      throw new Error("entityId is required when entityType is provided");
    }

    return this.taskRepo.findAllOrByEntity(params);
  }
}
