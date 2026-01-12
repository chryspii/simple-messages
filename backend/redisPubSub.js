import { createClient } from "redis";

export async function createRedisPubSub() {
  const pub = createClient();
  const sub = createClient();

  await pub.connect();
  await sub.connect();

  return { pub, sub };
}
