import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import {
  AccountRepository,
  LedgerRepository,
  UserRepository,
} from "repositories";
import { LedgerServices } from "services";

export class LedgerController {
  private ledgerService: LedgerServices;

  constructor() {
    const ledgerRepository = new LedgerRepository();
    const userRepository = new UserRepository();
    const accountRepository = new AccountRepository();

    this.ledgerService = new LedgerServices(
      ledgerRepository,
      userRepository,
      accountRepository,
    );
  }

  getHistory = async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;
      const { limit = 20, cursor } = req.query;

      if (!accountId) {
        return res.status(400).json({
          message: "accountId is required",
        });
      }

      const result = await this.ledgerService.findHistory(
        accountId,
        Number(limit),
        cursor as string | undefined,
      );

      sendSuccess(res, result, "Histories retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  };

  getBalances = async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;

      if (!accountId) {
        return res.status(400).json({
          message: "accountId is required",
        });
      }

      const result = await this.ledgerService.getBalances(accountId);

      sendSuccess(res, result, "Balances retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  };

  async getBalance(req: Request, res: Response) {
    try {
      const { userId, venueId, courierId, eventId, communityId } = req.query;

      const result = await this.ledgerService.getBalanceByOwner({
        userId: userId as string | undefined,
        venueId: venueId as string | undefined,
        courierId: courierId as string | undefined,
        eventId: eventId as string | undefined,
        communityId: communityId as string | undefined,
      });

      sendSuccess(res, result, "Balances retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  getUserTransactions = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      const { cursor } = req.query;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const result = await this.ledgerService.getUserTransactions(
        userId,
        cursor as string | undefined,
      );

      sendSuccess(res, result, "Histories retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  };

  getVenueTransactions = async (req: Request, res: Response) => {
    try {
      const { venueId } = req.params;
      const { cursor } = req.query;

      if (!venueId) {
        return res.status(400).json({
          message: "venueId is required",
        });
      }

      const result = await this.ledgerService.getVenueTransactions(
        venueId,
        cursor as string | undefined,
      );

      sendSuccess(res, result, "Histories retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  };

  getCommunityTransactions = async (req: Request, res: Response) => {
    try {
      const { communityId } = req.params;
      const { cursor } = req.query;

      if (!communityId) {
        return res.status(400).json({
          message: "communityId is required",
        });
      }

      const result = await this.ledgerService.getCommunityTransactions(
        communityId,
        cursor as string | undefined,
      );

      sendSuccess(res, result, "Histories retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  };

  getEventTransactions = async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const { cursor } = req.query;

      if (!eventId) {
        return res.status(400).json({
          message: "eventId is required",
        });
      }

      const result = await this.ledgerService.getCommunityTransactions(
        eventId,
        cursor as string | undefined,
      );

      sendSuccess(res, result, "Histories retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  };

  getCourierTransactions = async (req: Request, res: Response) => {
    try {
      const { courierId } = req.params;
      const { cursor } = req.query;

      if (!courierId) {
        return res.status(400).json({
          message: "courierId is required",
        });
      }

      const result = await this.ledgerService.getCommunityTransactions(
        courierId,
        cursor as string | undefined,
      );

      sendSuccess(res, result, "Histories retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  };
}
