const redis = require("redis");

const REDIS_HOST =  process.env.REDIS_HOST
const REDIS_PORT =  process.env.REDIS_PORT
const REDIS_PASSWORD =  process.env.REDIS_PASSWORD

const redisClient = async () => {
  const client = redis.createClient({
    username: "default",
    password: REDIS_PASSWORD,
    socket: {
      host: REDIS_HOST,
      port: REDIS_PORT,
    },
  });
  client.on("error", (err) => console.log("Redis error", err));
  await client.connect();
  return client;
};

module.exports = redisClient;
