const AWS = require('aws-sdk');

const sqs = new AWS.SQS({ region: SQS_WRITE_REGION ||'us-east-1' });
const writeQueueUrl = 'YOUR_AWS_SQS_WRITE_QUEUE_URL';

exports.handler = async () => {
    const params = {
        QueueUrl: writeQueueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 10, // Batch by time interval
    };

    const data = await sqs.receiveMessage(params).promise();
    if (!data.Messages) return { statusCode: 200 };

    // Process messages in batch (send to write workers)
    for (const message of data.Messages) {
        // Forward to write workers (handled by SQS)
        await sqs.deleteMessage({
            QueueUrl: writeQueueUrl,
            ReceiptHandle: message.ReceiptHandle,
        }).promise();
    }

    return { statusCode: 200 };
};