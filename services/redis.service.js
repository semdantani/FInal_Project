import Redis from "ioredis";

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
});

redisClient.on("connect", () => {});

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

export default redisClient;
