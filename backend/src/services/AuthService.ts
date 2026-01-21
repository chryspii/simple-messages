import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/UserModel.js";
import { env } from "../config/env.js";

export class AuthService {
  static async register(
    username: string,
    email: string,
    password: string,
    confirmPassword: string
  ) {
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new Error("Invalid email format");
    }

    const exists = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (exists) {
      throw new Error("User already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      passwordHash
    });

    return { id: user._id, username, email };
  }

  static async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        email: user.email
      },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    };
  }
}
