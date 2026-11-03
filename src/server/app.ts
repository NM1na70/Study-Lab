import Fastify from 'fastify';
import { isIP } from 'node:net';
import serveStatic from '@fastify/static';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { lessons } from '../shared/lessons.js';
import { mutationSchema } from '../shared/schema.js';
import { DomainError } from '../shared/domain.js';
import { Store } from './store.js';
export async function createApp(
  path = process.env.DATABASE_PATH ?? 'data/study.sqlite',
  staticRoot = resolve('dist/client'),
) {
  const app = Fastify({ logger: false, bodyLimit: 32_768 });
  const store = new Store(path);
  app.addHook('onClose', async () => {
    store.close();
  });
  app.addHook('onRequest', async (request, reply) => {
    reply
      .header('X-Content-Type-Options', 'nosniff')
      .header('Referrer-Policy', 'no-referrer')
      .header('X-Frame-Options', 'DENY');
    reply.header(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );
    const host = new URL(`http://${request.headers.host}`).hostname.replace(
      /^\[|\]$/g,
      '',
    );
    if (host !== 'localhost' && !isIP(host))
      return reply
        .code(403)
        .send({ error: 'Use localhost or the host IP address.' });
    if (request.url.startsWith('/api/'))
      reply.header('Cache-Control', 'no-store');
    // Local unauthenticated learner: reject cross-origin writes (including DNS rebinding origins).
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const origin = request.headers.origin;
      if (
        request.headers['sec-fetch-site'] === 'cross-site' ||
        (origin &&
          origin !== `http://${request.headers.host}` &&
          origin !== `https://${request.headers.host}`)
      )
        return reply
          .code(403)
          .send({ error: 'Cross-origin writes are not allowed.' });
    }
  });
  app.setErrorHandler((error, _request, reply) => {
    const status =
      error instanceof DomainError
        ? error.statusCode
        : typeof error === 'object' &&
            error !== null &&
            'statusCode' in error &&
            typeof error.statusCode === 'number'
          ? error.statusCode
          : 500;
    reply.code(status).send({
      error:
        status < 500 && error instanceof Error
          ? error.message
          : 'Could not save or load progress. Try again.',
    });
  });
  app.get('/api/health', () => {
    store.db.prepare('SELECT 1').get();
    return { status: 'ok' };
  });
  app.get('/api/lessons', () => ({
    lessons,
    progress: lessons.map((l) => store.get(l)),
  }));
  app.post<{ Params: { id: string } }>(
    '/api/progress/:id',
    async (request, reply) => {
      const lesson = lessons.find((l) => l.id === request.params.id);
      if (!lesson) return reply.code(404).send({ error: 'Lesson not found.' });
      const parsed = mutationSchema.safeParse(request.body);
      if (!parsed.success)
        return reply.code(400).send({ error: 'Invalid progress request.' });
      return store.update(lesson, parsed.data);
    },
  );
  if (existsSync(staticRoot)) {
    await app.register(serveStatic, { root: staticRoot });
    app.setNotFoundHandler((request, reply) =>
      request.url.startsWith('/api/')
        ? reply.code(404).send({ error: 'Not found.' })
        : reply.code(404).send({ error: 'Page not found. Use the dashboard.' }),
    );
  }
  return app;
}
