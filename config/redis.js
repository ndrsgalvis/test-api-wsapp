const redis = require('redis');

const redisClient = async () => {
    const client = redis.createClient();
    client.on('error', err => console.log('Redis error', err));
    await client.connect();
    return client;
}

module.exports = redisClient;