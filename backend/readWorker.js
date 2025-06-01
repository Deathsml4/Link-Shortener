const AWS = require('aws-sdk');
const { Client } = require('pg');
const redis = require('redis');

const sqs = new AWS.SQS({ region: 'us-east-1' });
const sns = new AWS.SNS({ region: 'us-east-1' });
const readQueueUrl = 'YOUR_AWS_SQS_READ_QUEUE_URL';
const topicArn = 'YOUR_AWS_SNS_TOPIC_ARN';

const pgClient = new Client({
    user: 'postgres',
    host: 'YOUR_AWS_RDS_OR_AZURE_POSTGRES_HOST',
    database: 'url_shortener',
    password: 'YOUR_PASSWORD',
    port: 5432,
});

const redisClient = redis.createClient({
    url: 'redis://YOUR_AWS_ELASTICACHE_OR_AZURE_REDIS_HOST:6379',
});

exports.handler = async () => {
    await pgClient.connect();
    await redisClient.connect();

    const params = {
        QueueUrl: readQueueUrl,
        MaxNumberOfMessages: 10,
    };

    const data = await sqs.receiveMessage(params).promise();
    if (!data.Messages) return { statusCode: 200 };

    for (const message of data.Messages) {
        const { shortCode } = JSON.parse(message.Body);
        let longUrl = await redisClient.get(shortCode);

        if (!longUrl) {
            const result = await pgClient.query(
                'SELECT long_url FROM urls WHERE short_code = $1',
                [shortCode]
            );
            longUrl = result.rows[0]?.long_url;
            if (longUrl) {
                await redisClient.setEx(shortCode, 3600, longUrl);
                await sns.publish({
                    TopicArn: topicArn,
                    Message: JSON.stringify({ shortCode, longUrl }),
                }).promise();
            }
        }

        await sqs.deleteMessage({
            QueueUrl: readQueueUrl,
            ReceiptHandle: message.ReceiptHandle,
        }).promise();
    }

    await pgClient.end();
    await redisClient.quit();
    return { statusCode: 200 };
};