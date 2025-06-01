const express = require('express');
const AWS = require('aws-sdk');
const { Client } = require('pg');
const redis = require('redis');
const rateLimit = require('express-rate-limit');
const shortid = require('shortid');

const app = express();
app.use(express.json());

// AWS SQS Configuration
const sqs = new AWS.SQS({ region: 'us-east-1' });
const writeQueueUrl = 'YOUR_AWS_SQS_WRITE_QUEUE_URL';
const readQueueUrl = 'YOUR_AWS_SQS_READ_QUEUE_URL';

// PostgreSQL Configuration
const pgClient = new Client({
    user: 'postgres',
    host: 'YOUR_AWS_RDS_OR_AZURE_POSTGRES_HOST',
    database: 'url_shortener',
    password: 'YOUR_PASSWORD',
    port: 5432,
});
pgClient.connect();

// Redis Configuration
const redisClient = redis.createClient({
    url: 'redis://YOUR_AWS_ELASTICACHE_OR_AZURE_REDIS_HOST:6379',
});
redisClient.connect();

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
});
app.use(limiter);

// Shorten URL (Write Flow)
app.post('/shorten', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const shortCode = shortid.generate();
    const params = {
        MessageBody: JSON.stringify({ shortCode, url }),
        QueueUrl: writeQueueUrl,
    };

    try {
        await sqs.sendMessage(params).promise();
        res.json({ shortUrl: `http://your-domain/${shortCode}` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to queue write request' });
    }
});

// Redirect URL (Read Flow)
app.get('/:shortCode', async (req, res) => {
    const { shortCode } = req.params;

    const params = {
        MessageBody: JSON.stringify({ shortCode }),
        QueueUrl: readQueueUrl,
    };

    try {
        await sqs.sendMessage(params).promise();
        res.status(202).json({ message: 'Redirect request queued' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to queue read request' });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));