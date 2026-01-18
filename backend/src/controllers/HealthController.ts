import { Mongo } from "../servers/Mongo.js";
import { RedisClient } from "../servers/RedisClient.js";
import { RabbitMQ } from "../servers/Rabbitmq.js";

export class HealthController {
  static basic(_req, res) {
    res.json({
      status: "ok",
      service: "backend",
      timestamp: new Date().toISOString()
    });
  }

  static deep(_req, res) {
    const mongo = Mongo.isHealthy();
    const redis = RedisClient.isHealthy();
    const rabbitmq = RabbitMQ.isHealthy();

    const ok = mongo && redis && rabbitmq;

    res.status(ok ? 200 : 503).json({
      status: ok ? "ok" : "degraded",
      mongo,
      redis,
      rabbitmq
    });
  }
}
