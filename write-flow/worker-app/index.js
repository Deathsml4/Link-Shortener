const { Client } = require('pg');
const amqplib = require('amqplib');
const nanoid = require('nanoid');

(async () => {
  const conn = await amqplib.connect(process.env.RABBITMQ_URL);
  const channel = await conn.createChannel();
  const queue = 'batched-write';

  await channel.assertQueue(queue);

  const pgClient = new Client({ connectionString: process.env.POSTGRES_URL });
  await pgClient.connect();

  channel.consume(queue, async (msg) => {
    const batch = JSON.parse(msg.content.toString());
    for (const item of batch) {
      const shortCode = nanoid.nanoid(6);
      await pgClient.query('INSERT INTO urls (short_code, original_url) VALUES ($1, $2)', [shortCode, item.originalUrl]);
    }
    channel.ack(msg);
  });
})();
