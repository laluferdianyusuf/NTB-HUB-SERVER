import { Request, Response } from "express";
import { VenueStaffService } from "services";

const staffService = new VenueStaffService();

export class VenueStaffController {
  async addStaff(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const staff = await staffService.addStaff(venueId, req.body);
      res
        .status(201)
        .json({ status: true, message: "Staff created", data: staff });
    } catch (err: any) {
      res.status(400).json({ status: false, message: err.message });
    }
  }

  async updateStaff(req: Request, res: Response) {
    try {
      const { staffId } = req.params;
      const staff = await staffService.updateStaff(staffId, req.body);
      res.json({ status: true, message: "Staff updated", data: staff });
    } catch (err: any) {
      res.status(400).json({ status: false, message: err.message });
    }
  }

  async deleteStaff(req: Request, res: Response) {
    try {
      const { staffId } = req.params;
      const staff = await staffService.deleteStaff(staffId);
      res.json({ status: true, message: "Staff deleted", data: staff });
    } catch (err: any) {
      res.status(400).json({ status: false, message: err.message });
    }
  }

  async listStaff(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const staffs = await staffService.listStaff(venueId);
      res.json({ status: true, message: "Staffs retrieved", data: staffs });
    } catch (err: any) {
      res.status(400).json({ status: false, message: err.message });
    }
  }
}
