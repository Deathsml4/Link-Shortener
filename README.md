# URL Shortener Hybrid

A cloud-native hybrid URL shortening service using AWS (Write) and Azure (Read).

## Features
- Write Flow: API Gateway → RabbitMQ → PostgreSQL
- Read Flow: Azure Function → Redis → PostgreSQL

## Run Locally
```bash
cp .env.sample .env
npm install --prefix write-flow/api-gateway-handler
npm install --prefix write-flow/batch-processor
npm install --prefix write-flow/worker-app
npm install --prefix read-flow/function-app/GetRedirect
```
