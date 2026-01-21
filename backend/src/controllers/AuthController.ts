import { Request, Response } from "express";
import { AuthService } from "../services/AuthService.js";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { username, email, password, confirmPassword } = req.body;

      const user = await AuthService.register(
        username,
        email,
        password,
        confirmPassword
      );

      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({
        error: (err as Error).message
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.json(result);
    } catch (err) {
      res.status(401).json({
        error: (err as Error).message
      });
    }
  }
}
