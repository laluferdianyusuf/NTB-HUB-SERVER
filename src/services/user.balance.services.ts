import { UserBalance } from "@prisma/client";
import { UserBalanceRepository } from "repositories";

const userBalanceRepository = new UserBalanceRepository();

export class UserBalanceServices {
  async getUserBalance(userId: string) {
    try {
      const balance = await userBalanceRepository.getBalanceByUserId(userId);
      return {
        status: true,
        status_code: 200,
        message: "User balance retrieved successfully",
        data: balance,
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
