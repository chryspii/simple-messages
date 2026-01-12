import mongoose from "mongoose";
import amqp from "amqplib";
import { createClient } from "redis";

const MAX_RETRIES = 3;

// MongoDB
await mongoose.connect("mongodb://localhost:27017/messages");

const Message = mongoose.model("Message", {
  name: String,
  subject: String,
  message: String,
  status: String,
  retries: Number
});

// Redis
const redis = createClient();
await redis.connect();

// RabbitMQ
const conn = await amqp.connect("amqp://localhost");
const channel = await conn.createChannel();

if (process.env.NODE_ENV !== "production") {
  await channel.deleteQueue("messages").catch(() => {});
  await channel.deleteQueue("messages.retry").catch(() => {});
  await channel.deleteQueue("messages.dlq").catch(() => {});
}

await channel.assertExchange("messages.dlx", "direct", { durable: true });

await channel.assertQueue("messages", {
  durable: true,
  deadLetterExchange: "messages.dlx",
  deadLetterRoutingKey: "retry"
});

await channel.assertQueue("messages.retry", {
  durable: true,
  messageTtl: 5000,
  deadLetterExchange: "",
  deadLetterRoutingKey: "messages"
});

await channel.assertQueue("messages.dlq", { durable: true });

await channel.bindQueue("messages.retry", "messages.dlx", "retry");
await channel.bindQueue("messages.dlq", "messages.dlx", "dlq");

channel.prefetch(1);

console.log("Worker running with retry + DLQ");

channel.consume("messages", async msg => {
  const { id, retries = 0 } = JSON.parse(msg.content.toString());

  try {
    await Message.findByIdAndUpdate(id, {
      status: "stored",
      retries
    });

    await redis.set(`message:${id}`, "stored");
    await redis.publish(
      "message-status",
      JSON.stringify({ type: "MESSAGE_STORED", id })
    );

    channel.ack(msg);
  } catch {
    if (retries >= MAX_RETRIES) {
      await Message.findByIdAndUpdate(id, {
        status: "failed",
        retries
      });

      await redis.set(`message:${id}`, "failed");
      await redis.publish(
        "message-status",
        JSON.stringify({ type: "MESSAGE_FAILED", id })
      );

      channel.publish(
        "messages.dlx",
        "dlq",
        Buffer.from(JSON.stringify({ id, retries }))
      );

      channel.ack(msg);
      return;
    }

    channel.publish(
      "messages.dlx",
      "retry",
      Buffer.from(JSON.stringify({ id, retries: retries + 1 })),
      { persistent: true }
    );

    await Message.findByIdAndUpdate(id, {
      status: "retrying",
      retries: retries + 1
    });

    await redis.set(`message:${id}`, "retrying");
    await redis.publish(
      "message-status",
      JSON.stringify({
        type: "MESSAGE_RETRY",
        id,
        retries: retries + 1
      })
    );

    channel.ack(msg);
  }
});
