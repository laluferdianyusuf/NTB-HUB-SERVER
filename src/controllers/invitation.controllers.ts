import { InvitationServices } from "services";
import { Request, Response } from "express";

export class InvitationController {
  private invitationServices: InvitationServices;

  constructor() {
    this.invitationServices = new InvitationServices();
  }

  async generateInvitationKey(req: Request, res: Response) {
    try {
      const { email, venueId } = req.body;

      const result = await this.invitationServices.generateInvitationKey(
        email,
        venueId,
      );
      return res.status(200).json({
        status: true,
        message: "Invitation created",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        status: false,
        message: error.message,
      });
    }
  }

  async generateEventInvitationKey(req: Request, res: Response) {
    try {
      const { email, eventId } = req.body;

      const result = await this.invitationServices.generateEventInvitationKey(
        email,
        eventId,
      );
      return res.status(200).json({
        status: true,
        message: "Invitation created",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        status: false,
        message: error.message,
      });
    }
  }

  async claimInvitation(req: Request, res: Response) {
    try {
      const result = await this.invitationServices.claimInvitation(
        req.body.key,
        req.user.id,
      );

      return res.status(200).json({
        status: true,
        message: "Invitation claimed",
        data: result,
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async claimEventInvitation(req: Request, res: Response) {
    try {
      const result = await this.invitationServices.claimEventInvitation(
        req.body.key,
        req.user.id,
      );

      return res.status(200).json({
        status: true,
        message: "Invitation claimed",
        data: result,
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }
}
