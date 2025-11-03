import { UserBalanceServices } from "services";

export class UserBalanceController {
  private userBalanceServices: UserBalanceServices;

  constructor() {
    this.userBalanceServices = new UserBalanceServices();
  }

  async getUserBalance(req: any, res: any) {
    const userId = req.params.userId;
    const result = await this.userBalanceServices.getUserBalance(userId);
    res.status(result.status_code).json(result);
  }
}
