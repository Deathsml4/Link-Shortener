const amqplib = require('amqplib');

exports.handler = async (event) => {
  const body = JSON.parse(event.body || '{}');
  const originalUrl = body.url;
  const conn = await amqplib.connect(process.env.RABBITMQ_URL);
  const channel = await conn.createChannel();
  const queue = 'write-queue';

  await channel.assertQueue(queue, { durable: true });
  await channel.sendToQueue(queue, Buffer.from(JSON.stringify({ originalUrl })));

  await channel.close();
  await conn.close();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'URL received' })
  };
};
