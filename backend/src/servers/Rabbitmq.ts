import amqp, { Channel } from "amqplib";
import { env } from "../config/env.js";

export class RabbitMQ {
  static channel: Channel | null = null;

  static async connect(retries = 10, delay = 3000) {
    let lastError: unknown;

    for (let i = 1; i <= retries; i++) {
      try {
        console.log(`Connecting to RabbitMQ (attempt ${i})`);
        const conn = await amqp.connect(env.RABBIT_URL);
        const channel = await conn.createChannel();
        this.channel = channel

        console.log("RabbitMQ connected");
        return { conn, channel };
      } catch (err) {
        lastError = err;
        console.warn(`RabbitMQ not ready, retrying in ${delay}ms`);
        await new Promise(res => setTimeout(res, delay));
      }
    }

    throw lastError;
  }

  static isHealthy(): boolean {
    return this.channel !== null;
  }
}
