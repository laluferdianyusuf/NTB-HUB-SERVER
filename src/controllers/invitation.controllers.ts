import { InvitationServices } from "services";
import { Request, Response } from "express";

export class InvitationController {
  private invitationServices: InvitationServices;

  constructor() {
    this.invitationServices = new InvitationServices();
  }

  async generateInvitationKey(req: Request, res: Response) {
    const result = await this.invitationServices.generateInvitationKey();
    return res.status(result.status_code).json(result);
  }
}
