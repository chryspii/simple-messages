const isLocal = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  MONGO_URL: isLocal ? "mongodb://localhost:27017/messages" : process.env.MONGO_URL,
  REDIS_URL: isLocal ? "redis://localhost:6379" : process.env.REDIS_URL,
  RABBIT_URL: isLocal ? "amqp://localhost" : process.env.RABBIT_URL
};
