const redis = require('redis');
const { Client } = require('pg');

module.exports = async function (context, req) {
  const code = req.params.code;
  const redisClient = redis.createClient({ url: process.env.REDIS_URL });
  await redisClient.connect();

  let longUrl = await redisClient.get(code);

  if (!longUrl) {
    const pgClient = new Client({ connectionString: process.env.POSTGRES_URL });
    await pgClient.connect();

    const res = await pgClient.query('SELECT original_url FROM urls WHERE short_code=$1', [code]);
    longUrl = res.rows[0]?.original_url;

    if (longUrl) {
      await redisClient.set(code, longUrl);
    }
    await pgClient.end();
  }

  await redisClient.disconnect();

  context.res = {
    status: longUrl ? 302 : 404,
    headers: longUrl ? { Location: longUrl } : {},
    body: longUrl ? null : 'Not Found'
  };
};
