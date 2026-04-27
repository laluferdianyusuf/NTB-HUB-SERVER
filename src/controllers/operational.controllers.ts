import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { OperationalServices } from "services";

const operationalServices = new OperationalServices();

export class OperationalControllers {
  async createOperationalHours(req: Request, res: Response) {
    try {
      const { venueId } = req.params;
      const { operationalHours } = req.body;

      const result = await operationalServices.createOperationalHours(
        venueId,
        operationalHours,
      );

      sendSuccess(res, result, "Operational hours saved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async getOperationalHours(req: Request, res: Response) {
    try {
      const { venueId } = req.params;

      const result = await operationalServices.getOperationalHours(venueId);

      sendSuccess(res, result, "Operational hours retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async editHours(req: Request, res: Response) {
    try {
      const { venueId } = req.params;
      const { dayOfWeek, opensAt, closesAt } = req.body;

      const result = await operationalServices.editHours({
        venueId,
        dayOfWeek,
        opensAt,
        closesAt,
      });

      sendSuccess(res, result, "Hours updated");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async toggleDay(req: Request, res: Response) {
    try {
      const { venueId } = req.params;
      const { dayOfWeek, isOpen } = req.body;

      const result = await operationalServices.toggleDay({
        venueId,
        dayOfWeek,
        isOpen,
      });

      sendSuccess(res, result, "Day updated");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async copyNextDay(req: Request, res: Response) {
    try {
      const { venueId } = req.params;
      const { fromDay, toDay } = req.body;

      const result = await operationalServices.copyNextDay({
        venueId,
        fromDay,
        toDay,
      });

      sendSuccess(res, result, "Schedule copied");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async holidayClosure(req: Request, res: Response) {
    try {
      const { venueId } = req.params;

      const result = await operationalServices.holidayClosure(venueId);

      sendSuccess(res, result, "Venue closed");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async specialEventHours(req: Request, res: Response) {
    try {
      const { venueId } = req.params;
      const { opensAt, closesAt } = req.body;

      const result = await operationalServices.specialEventHours(
        venueId,
        opensAt,
        closesAt,
      );

      sendSuccess(res, result, "Special event hours updated");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
