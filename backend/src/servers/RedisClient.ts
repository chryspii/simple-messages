import { createClient, RedisClientType } from "redis";
import { env } from "../config/env.js";

export class RedisClient {
  private static client: RedisClientType;

  static async get(): Promise<RedisClientType> {
    if (!this.client) {
      this.client = createClient({ url: env.REDIS_URL });
      await this.client.connect();
      console.log("Redis connected");
    }
    return this.client;
  }

  static isHealthy(): boolean {
    return Boolean(this.client?.isReady);
  }
}
