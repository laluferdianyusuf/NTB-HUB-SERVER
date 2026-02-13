export class TaskAnalyticsService {
  async track(event: string, payload: any) {
    // bisa ke:
    // - DB
    // - ClickHouse
    // - Segment / GA
    console.log("[TASK_ANALYTICS]", event, payload);
  }
}
