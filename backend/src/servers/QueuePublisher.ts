import amqp, { Channel } from "amqplib";
import { env } from "../config/env.js";

export class QueuePublisher {
  private channel!: Channel;

  async connect() {
    const conn = await amqp.connect(env.RABBIT_URL);
    this.channel = await conn.createChannel();
  }

  publishMessage(id: string, retries = 0) {
    this.channel.sendToQueue(
      "messages",
      Buffer.from(JSON.stringify({ id, retries })),
      { persistent: true }
    );
  }
}
