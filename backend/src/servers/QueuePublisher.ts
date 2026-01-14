import { Channel } from "amqplib";
import { RabbitMQ } from "./Rabbitmq.js";

export class QueuePublisher {
  private channel!: Channel;

  async connect() {
    const { conn, channel } = await RabbitMQ.connect();
    this.channel = channel;
  }

  publishMessage(id: string, retries = 0) {
    this.channel.sendToQueue(
      "messages",
      Buffer.from(JSON.stringify({ id, retries })),
      { persistent: true }
    );
  }
}
