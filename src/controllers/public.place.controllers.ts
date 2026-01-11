import { Request, Response } from "express";
import { PublicPlaceService } from "../services";
import { PublicPlaceType } from "@prisma/client";

export class PublicPlaceController {
  private service = new PublicPlaceService();

  async list(req: Request, res: Response) {
    const type = req.query.type as PublicPlaceType | undefined;
    const data = await this.service.getAll(type);

    res.status(200).json({
      status: true,
      data,
    });
  }

  async detail(req: Request, res: Response) {
    try {
      const data = await this.service.getDetail(req.params.id);
      res.json({ status: true, data });
    } catch {
      res.status(404).json({
        status: false,
        message: "Public place not found",
      });
    }
  }

  async create(req: Request, res: Response) {
    const data = await this.service.create(req.body);
    res
      .status(201)
      .json({ status: true, message: "Public place created", data });
  }

  async update(req: Request, res: Response) {
    const data = await this.service.update(req.params.id, req.body);
    res.json({ status: true, data });
  }

  async deactivate(req: Request, res: Response) {
    await this.service.deactivate(req.params.id);
    res.json({
      status: true,
      message: "Public place deactivated",
    });
  }
}
