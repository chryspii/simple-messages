import { createClient } from "redis";
import { env } from "../config/env.js";

export class RedisPubSub {
  static async create() {
    const pub = createClient({ url: env.REDIS_URL });
    const sub = createClient({ url: env.REDIS_URL });

    await pub.connect();
    await sub.connect();

    return { pub, sub };
  }
}
