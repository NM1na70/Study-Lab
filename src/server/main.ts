import { createApp } from './app.js';

// Start the server with localhost as the default bind address outside Docker
const app = await createApp();
await app.listen({
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '127.0.0.1',
});
console.log(`Study Lab listening on port ${process.env.PORT ?? 3000}`);

// Close the server and database before exiting on a normal stop signal
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    void app.close().then(() => process.exit(0));
  });
