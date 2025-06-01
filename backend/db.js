const { Client } = require('pg');

const pgClient = new Client({
    user: 'postgres',
    host: 'YOUR_AWS_RDS_OR_AZURE_POSTGRES_HOST',
    database: 'url_shortener',
    password: 'YOUR_PASSWORD',
    port: 5432,
});

pgClient.connect();

module.exports = pgClient;