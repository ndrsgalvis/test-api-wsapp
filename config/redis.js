const redis = require("redis");

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

const redisClient = async () => {
  const client = redis.createClient({
    username: "default",
    password: REDIS_PASSWORD,
    socket: {
      host: REDIS_HOST,
      port: REDIS_PORT,
      connectTimeout: 10000,
      keepAlive: 5000,
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.log("Too many retries, stopping...");
          return new Error("Too many retries");
        }

        return Math.min(retries * 100, 3000);
      },
    },
    maxRetriesPerRequest: 20,
  });

  // Error handling
  client.on("error", (err) => console.log("Redis error", err));

  // Connection events
  client.on("connect", () => console.log("Redis client connected"));
  client.on("reconnecting", () => console.log("Redis client reconnecting"));
  client.on("ready", () => console.log("Redis client ready"));
  client.on("end", () => console.log("Redis client connection ended"));

  await client.connect();
  return client;
};

module.exports = redisClient;
