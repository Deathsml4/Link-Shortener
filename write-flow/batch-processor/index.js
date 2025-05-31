const amqplib = require('amqplib');

(async () => {
  const conn = await amqplib.connect(process.env.RABBITMQ_URL);
  const inChannel = await conn.createChannel();
  const outChannel = await conn.createChannel();
  const inQueue = 'write-queue';
  const outQueue = 'batched-write';

  await inChannel.assertQueue(inQueue);
  await outChannel.assertQueue(outQueue);

  const buffer = [];
  setInterval(async () => {
    if (buffer.length > 0) {
      await outChannel.sendToQueue(outQueue, Buffer.from(JSON.stringify(buffer.splice(0))));
    }
  }, 5000);

  inChannel.consume(inQueue, (msg) => {
    if (msg !== null) {
      buffer.push(JSON.parse(msg.content.toString()));
      inChannel.ack(msg);
    }
  });
})();
