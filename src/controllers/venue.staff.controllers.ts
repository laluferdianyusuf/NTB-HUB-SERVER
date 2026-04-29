/* =========================================================
   controllers/venue-staff.controller.ts
========================================================= */

import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { VenueStaffService } from "services";

const service = new VenueStaffService();

export class VenueStaffController {
  async create(req: Request, res: Response) {
    try {
      const { venueId } = req.params;

      const result = await service.createStaff(venueId, req.body);

      sendSuccess(res, result, "Staff created", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { staffId } = req.params;

      const result = await service.updateStaff(staffId, req.body);
      sendSuccess(res, result, "Staff updated");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { staffId } = req.params;

      await service.deleteStaff(staffId);
      sendSuccess(res, "Staff updated");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async detail(req: Request, res: Response) {
    try {
      const { staffId } = req.params;

      const result = await service.detailStaff(staffId);
      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async list(req: Request, res: Response) {
    try {
      const venueId = req.query.venueId?.toString() || "";

      const page = Number(req.query.page || 1);

      const limit = Number(req.query.limit || 10);

      const search = req.query.search?.toString();

      const result = await service.listStaff(venueId, page, limit, search);
      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
