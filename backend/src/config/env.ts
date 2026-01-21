import process from "node:process";

const isLocal =
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV === "test";

export const env = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  ADMIN_USER: process.env.ADMIN_USER,
  ADMIN_PASS: process.env.ADMIN_PASS,

  NODE_ENV: process.env.NODE_ENV ?? "development",

  MONGO_URL: isLocal
    ? `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@localhost:27017/messages?authSource=admin`
    : `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@mongo:27017/messages?authSource=admin`,

  REDIS_URL: isLocal
    ? `redis://:${process.env.REDIS_PASS}@localhost:6379`
    : `redis://:${process.env.REDIS_PASS}@redis:6379`,

  RABBIT_URL: isLocal
    ? `amqp://${process.env.RABBIT_USER}:${process.env.RABBIT_PASS}@localhost:5672`
    : `amqp://${process.env.RABBIT_USER}:${process.env.RABBIT_PASS}@rabbitmq:5672`
}
