const AWS = require('aws-sdk');
const { Client } = require('pg');

const sqs = new AWS.SQS({ region: 'us-east-1' });
const writeQueueUrl = 'YOUR_AWS_SQS_WRITE_QUEUE_URL';

const pgClient = new Client({
    user: 'postgres',
    host: 'YOUR_AWS_RDS_OR_AZURE_POSTGRES_HOST',
    database: 'url_shortener',
    password: 'YOUR_PASSWORD',
    port: 5432,
});

exports.handler = async () => {
    await pgClient.connect();

    const params = {
        QueueUrl: writeQueueUrl,
        MaxNumberOfMessages: 10,
    };

    const data = await sqs.receiveMessage(params).promise();
    if (!data.Messages) return { statusCode: 200 };

    for (const message of data.Messages) {
        const { shortCode, url } = JSON.parse(message.Body);
        await pgClient.query(
            'INSERT INTO urls (short_code, long_url) VALUES ($1, $2)',
            [shortCode, url]
        );
        await sqs.deleteMessage({
            QueueUrl: writeQueueUrl,
            ReceiptHandle: message.ReceiptHandle,
        }).promise();
    }

    await pgClient.end();
    return { statusCode: 200 };
};