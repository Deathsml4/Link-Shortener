const redis = require('redis');

const redisClient = redis.createClient({
    url: 'redis://YOUR_AWS_ELASTICACHE_OR_AZURE_REDIS_HOST:6379',
});

redisClient.connect();

module.exports = redisClient;