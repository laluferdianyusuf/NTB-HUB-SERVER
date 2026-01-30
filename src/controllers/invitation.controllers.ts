import { InvitationServices } from "services";
import { Request, Response } from "express";

export class InvitationController {
  private invitationServices: InvitationServices;

  constructor() {
    this.invitationServices = new InvitationServices();
  }

  async generateInvitationKey(req: Request, res: Response) {
    const files = req.files as {
      image?: Express.Multer.File;
      gallery?: Express.Multer.File[];
    };

    const {
      email,
      venueName,
      address,
      city,
      province,
      description,
      latitude,
      longitude,
    } = req.body;

    const result = await this.invitationServices.generateInvitationKey(
      email,
      venueName,
      address,
      city,
      province,
      description,
      latitude,
      longitude,
      files,
    );
    return res.status(result.status_code).json(result);
  }

  async findAllInvitationKeys(req: Request, res: Response) {
    const result = await this.invitationServices.findAllInvitationKeys();
    return res.status(result.status_code).json(result);
  }

  async findInvitationKey(req: Request, res: Response) {
    const key = req.params.key;
    const result = await this.invitationServices.findInvitationKey(key);
    return res.status(result.status_code).json(result);
  }

  async findInvitationKeyByVenueId(req: Request, res: Response) {
    const venueId = req.params.venueId;
    const result =
      await this.invitationServices.findInvitationKeysByVenueId(venueId);
    return res.status(result.status_code).json(result);
  }
}
