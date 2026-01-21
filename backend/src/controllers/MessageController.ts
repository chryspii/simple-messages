import { Request, Response } from "express";
import { Router } from "express";
import { MessageService } from "../services/MessageService.js";
import { AuthRequest } from "../middlewares/authMiddleware.js";

export class MessageController {
  constructor(private service: MessageService) {}

  list = async (req: Request, res: Response) => {
    try {
      const messages = await this.service.list();
      res.json(messages);
    } catch (err) {
      res.status(500).json({
        error: (err as Error).message
      });
    }
  }

  getFailed = async (req: Request, res: Response) => {
    try {
      const messages = await this.service.getFailed();
      res.json(messages);
    } catch (err) {
      res.status(500).json({
        error: (err as Error).message
      });
    }
  }

  create = async (req: AuthRequest, res: Response) => {
    try {
      const { subject, message } = req.body;

      if (!subject || !message) {
        return res.status(400).json({
          error: "Subject and message are required"
        });
      }

      const user = req.user!;

      const msg = await this.service.create({
        subject,
        message,
        userId: user.id,
        name: user.username
      });

      res.status(201).json(msg);
    } catch (err) {
      res.status(500).json({
        error: (err as Error).message
      });
    }
  }

  delete = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;

      await this.service.delete(req.params.id, user.id);

      res.status(201).json({ success: true });
    } catch (err) {
      const message = (err as Error).message;

      if (message === "FORBIDDEN") {
        return res.status(403).json({
          error: "You are not allowed to delete this message"
        });
      }

      res.status(500).json({
        error: message
      });
    }
  }

  reprocess = async (req: AuthRequest, res: Response) => {
    try {
      await this.service.reprocess(req.params.id);

      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({
        error: (err as Error).message
      });
    }
  }
}

