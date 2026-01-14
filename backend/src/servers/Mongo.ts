import mongoose from "mongoose";
import { env } from "../config/env.js";

export class Mongo {
  static async connect() {
    await mongoose.connect(env.MONGO_URL);
    console.log("MongoDB connected");
  }
}
