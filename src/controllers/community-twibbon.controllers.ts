import { Request, Response } from "express";
import { CommunityTwibbonService } from "services";
import { sendSuccess, sendError } from "helpers/response";

export class CommunityTwibbonController {
  private service = new CommunityTwibbonService();

  getActive = async (req: Request, res: Response) => {
    try {
      const { communityId } = req.params;

      const data = await this.service.getActiveTwibbons(communityId);

      return sendSuccess(res, data, "Twibbons fetched");
    } catch (error: any) {
      return sendError(res, error.message || "FAILED_TO_FETCH_TWIBBONS");
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { communityId } = req.params;
      const userId = req.user?.id;
      const image = req.file;

      const data = {
        title: req.body.title,
        description: req.body.description,
      };

      const twibbon = await this.service.createTwibbon(
        communityId,
        String(userId),
        data,
        image as Express.Multer.File,
      );

      return sendSuccess(res, twibbon, "Twibbon created", 201);
    } catch (error: any) {
      console.log(error);

      return sendError(res, error.message || "FAILED_TO_CREATE_TWIBBON");
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { twibbonId } = req.params;

      const twibbon = await this.service.updateTwibbon(twibbonId, req.body);

      return sendSuccess(res, twibbon, "Twibbon updated");
    } catch (error: any) {
      return sendError(res, error.message || "FAILED_TO_UPDATE_TWIBBON");
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { twibbonId } = req.params;

      await this.service.deleteTwibbon(twibbonId);

      return sendSuccess(res, null, "Twibbon deleted");
    } catch (error: any) {
      return sendError(res, error.message || "FAILED_TO_DELETE_TWIBBON");
    }
  };
}
