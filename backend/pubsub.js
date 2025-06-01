const AWS = require('aws-sdk');
const redis = require('redis');

const sns = new AWS.SNS({ region: 'us-east-1' });
const topicArn = 'YOUR_AWS_SNS_TOPIC_ARN';
const redisClient = redis.createClient({
    url: 'redis://YOUR_AWS_ELASTICACHE_OR_AZURE_REDIS_HOST:6379',
});

redisClient.connect();

exports.handler = async (event) => {
    for (const record of event.Records) {
        const { shortCode, longUrl } = JSON.parse(record.Sns.Message);
        await redisClient.setEx(shortCode, 3600, longUrl);
    }
    return { statusCode: 200 };
};