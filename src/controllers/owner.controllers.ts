import { Request, Response } from "express";
import { OwnerServices } from "services";

export class OwnerControllers {
  private ownerServices: OwnerServices;

  constructor() {
    this.ownerServices = new OwnerServices();
  }

  async createOwner(req: Request, res: Response) {
    const result = await this.ownerServices.createOwner(req.body, req.file);

    res.status(result.status_code).json(result);
  }

  async getOwnerByVenue(req: Request, res: Response) {
    const { venueId } = req.params;
    const result = await this.ownerServices.findOwnerByVenue(venueId);

    res.status(result.status_code).json(result);
  }
}
