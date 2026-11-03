import { createApp } from './app.js';
const app = await createApp();
await app.listen({
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '127.0.0.1',
});
console.log(`Study Lab listening on port ${process.env.PORT ?? 3000}`);
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    void app.close().then(() => process.exit(0));
  });
