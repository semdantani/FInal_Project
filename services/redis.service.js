import Redis from "ioredis";

const redisClient = new Redis(process.env.REDIS_URL, {
  tls: {}, // still required for Redis Cloud
});

export default redisClient;
