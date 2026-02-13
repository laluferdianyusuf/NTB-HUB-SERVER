import { Request, Response } from "express";
import { z } from "zod";
import { CommentEntityType } from "@prisma/client";
import { CommentService } from "services";

export class CommentController {
  private service = new CommentService();

  list = async (req: Request, res: Response) => {
    const paramsSchema = z.object({
      entityType: z.nativeEnum(CommentEntityType),
      entityId: z.string().min(1),
    });

    const { entityType, entityId } = paramsSchema.parse(req.params);

    const comments = await this.service.list(entityType, entityId);
    return res.json(comments);
  };

  create = async (req: Request, res: Response) => {
    const bodySchema = z.object({
      entityType: z.nativeEnum(CommentEntityType),
      entityId: z.string().min(1),
      content: z.string().min(1),
      parentId: z.string().optional(),
    });

    const body = bodySchema.parse(req.body);

    const comment = await this.service.create({
      ...body,
      userId: req.user!.id,
    });

    return res.status(201).json(comment);
  };

  like = async (req: Request, res: Response) => {
    const paramsSchema = z.object({
      commentId: z.string().uuid(),
    });

    const { commentId } = paramsSchema.parse(req.params);

    const liked = await this.service.like(commentId, req.user!.id);

    return res.json({
      success: true,
      liked,
    });
  };

  report = async (req: Request, res: Response) => {
    const paramsSchema = z.object({
      commentId: z.string().uuid(),
    });

    const bodySchema = z.object({
      reason: z.string().min(3),
    });

    const { commentId } = paramsSchema.parse(req.params);
    const { reason } = bodySchema.parse(req.body);

    await this.service.report(commentId, req.user!.id, reason);

    return res.status(201).json({
      success: true,
      message: "Comment reported",
    });
  };

  delete = async (req: Request, res: Response) => {
    const paramsSchema = z.object({
      commentId: z.string().uuid(),
    });

    const { commentId } = paramsSchema.parse(req.params);

    await this.service.delete(commentId, req.user!.id);

    return res.json({
      success: true,
    });
  };
}
