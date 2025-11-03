import { PointsRepository } from "repositories";
const pointRepository = new PointsRepository();

export class PointsServices {
  async getUserTotalPoints(userId: string) {
    try {
      const totalPoints = await pointRepository.getTotalPoints(userId);
      return {
        status: true,
        status_code: 200,
        message: "Total points retrieved successfully",
        data: totalPoints,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error" + error.message,
        data: null,
      };
    }
  }

  async getPointByUserId(userId: string) {
    try {
      const points = await pointRepository.getPointsByUserId(userId);
      return {
        status: true,
        status_code: 200,
        message: "Points retrieved successfully",
        data: points,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error" + error.message,
        data: null,
      };
    }
  }
}
