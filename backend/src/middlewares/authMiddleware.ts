import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type AuthRequest = Request<{ id: string }, any, any, any> & {
  user?: {
    id: string;
    username: string;
    email: string;
  };
};

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = header.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      username: string;
      email: string;
    };

    req.user = {
      id: payload.userId,
      username: payload.username,
      email: payload.email
    };

    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
