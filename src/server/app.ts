// Import the HTTP server, static serving, lesson validation, and SQLite storage
import Fastify from 'fastify';
import { isIP } from 'node:net';
import serveStatic from '@fastify/static';
import { resolve } from 'node:path';
import { z } from 'zod';
import { answerSchema } from '../shared/schema.js';
import { existsSync } from 'node:fs';
import { lessons as bundledLessons } from '../shared/lessons.js';
import { News } from './news.js';
import { mutationSchema } from '../shared/schema.js';
import { DomainError } from '../shared/domain.js';
import { AiService, type AiOptions } from './ai.js';
import { Lab } from './lab.js';
import { quiz } from './quiz.js';
import { Store } from './store.js';

// Create the local API and optionally serve the built UI from the same origin
export async function createApp(
  path = process.env.DATABASE_PATH ?? 'data/study.sqlite',
  staticRoot = resolve('dist/client'),
  aiOptions: AiOptions = { ownerToken: process.env.STUDY_OWNER_TOKEN },
  options: { labClock?: () => number; newsFetch?: typeof fetch } = {},
) {
  const lessons = structuredClone(bundledLessons);

  // Limit incoming bodies and close the SQLite connection when the server shuts down
  const app = Fastify({ logger: false, bodyLimit: 32_768 });
  const store = new Store(path);
  const ai = new AiService(store.db, aiOptions);
  const news = new News(store, lessons, options.newsFetch);

  // Require the direct-local owner capability before fetching optional external news
  app.post('/api/news/update', async (request) => {
    ai.authorise(
      request.headers['x-study-owner'],
      request.ip,
      request.headers.host ?? '',
    );
    return news.update();
  });
  app.addHook('onClose', async () => {
    ai.disconnect();
    store.close();
  });

  // Apply browser security headers and restrict requests to localhost or an IP address
  app.addHook('onRequest', async (request, reply) => {
    reply
      .header('X-Content-Type-Options', 'nosniff')
      .header('Referrer-Policy', 'no-referrer')
      .header('X-Frame-Options', 'DENY');
    reply.header(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );

    // Reject arbitrary domain hosts to reduce DNS rebinding access to this unauthenticated app
    const host = new URL(`http://${request.headers.host}`).hostname.replace(
      /^\[|\]$/g,
      '',
    );
    if (host !== 'localhost' && !isIP(host))
      return reply
        .code(403)
        .send({ error: 'Use localhost or the host IP address.' });

    // Prevent browsers from caching responses that include learner progress
    if (request.url.startsWith('/api/'))
      reply.header('Cache-Control', 'no-store');

    // Reject browser writes whose origin does not match this local instance
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

  // Return useful client errors without exposing internal failure details
  app.setErrorHandler((error, _request, reply) => {
    const status =
      error instanceof z.ZodError
        ? 400
        : error instanceof DomainError
          ? error.statusCode
          : typeof error === 'object' &&
              error !== null &&
              'statusCode' in error &&
              typeof error.statusCode === 'number'
            ? error.statusCode
            : 500;
    reply.code(status).send({
      error:
        (error instanceof DomainError || status < 500) && error instanceof Error
          ? error.message
          : 'Could not save or load progress. Try again.',
    });
  });

  // Check SQLite readiness and load the bundled lessons with the one shared learner profile
  app.get('/api/health', () => {
    store.db.prepare('SELECT 1').get();
    return { status: 'ok' };
  });
  app.get('/api/lessons', () => {
    const progress = lessons.map((lesson) => store.get(lesson));
    for (const lesson of lessons)
      store.reviews.seed(
        lesson,
        progress.find((state) => state.lessonId === lesson.id)!,
      );
    return { lessons, progress, dueCount: store.reviews.snapshot().count };
  });

  // Apply the same owner boundary to model reads, actions, history and verification
  const lab = new Lab(store, options.labClock);
  app.get('/api/lab', (request) => {
    ai.authorise(
      request.headers['x-study-owner'],
      request.ip,
      request.headers.host ?? '',
    );
    return lab.read();
  });
  app.post('/api/lab', (request) => {
    ai.authorise(
      request.headers['x-study-owner'],
      request.ip,
      request.headers.host ?? '',
    );
    const body = z
      .object({
        revision: z.number().int().nonnegative(),
        action: z.enum([
          'start',
          'pause',
          'resume',
          'reset',
          'help',
          'command',
          'tick',
        ]),
        command: z.string().max(100).default(''),
      })
      .strict()
      .parse(request.body);
    return lab.update(body.revision, body.action, body.command);
  });
  app.get('/api/lab/history', (request) => {
    ai.authorise(
      request.headers['x-study-owner'],
      request.ip,
      request.headers.host ?? '',
    );
    return {
      runs: store.db
        .prepare('SELECT state FROM lab_history ORDER BY id DESC LIMIT 10')
        .all()
        .map((row) => JSON.parse(String(row.state))),
      results: store.db
        .prepare('SELECT state FROM lab_results ORDER BY rowid DESC LIMIT 10')
        .all()
        .map((row) => JSON.parse(String(row.state))),
    };
  });
  app.post('/api/lab/verify', (request) => {
    ai.authorise(
      request.headers['x-study-owner'],
      request.ip,
      request.headers.host ?? '',
    );
    const body = z
      .object({ revision: z.number().int().nonnegative() })
      .strict()
      .parse(request.body);
    const lesson = lessons.find(
      (lesson) => lesson.id === 'cyber-endpoint-correlation',
    )!;

    // Derive proof from server-held model state, never from a browser-supplied success flag
    const state = lab.read();
    return store.update(
      lesson,
      { action: 'check', taskId: 'defence-lab', revision: body.revision },
      {
        assisted: state.assisted,
        verified: lab.objectives(state).verified,
        id: 'defence-v1:' + state.revision,
        state: JSON.stringify(state),
      },
    );
  });

  // Keep quiz selection and recall sessions distinct from ordinary assessed progress writes
  app.get('/api/quiz', () => quiz(store, undefined, lessons));
  app.post('/api/quiz/refresh', (request) =>
    quiz(
      store,
      z
        .object({ revision: z.number().int().nonnegative() })
        .strict()
        .parse(request.body).revision,
      lessons,
    ),
  );
  app.get('/api/reviews', () => store.reviews.snapshot());
  app.post('/api/reviews/start', (request) => {
    const body = z
      .object({ course: z.enum(['English', 'Cybersecurity']) })
      .strict()
      .parse(request.body);
    return store.reviews.start(body.course);
  });
  app.post<{ Params: { id: string } }>('/api/reviews/:id', (request) => {
    const body = z
      .object({
        revision: z.number().int().nonnegative(),
        action: z.enum([
          'draft',
          'check',
          'hint',
          'solution',
          'next',
          'skip',
          'finish',
          'dismiss',
          'undo',
        ]),
        answer: answerSchema.optional(),
      })
      .strict()
      .parse(request.body);
    return store.reviews.update(request.params.id, body);
  });

  // Validate mutation input before applying lesson rules inside the storage transaction
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

  // Require both direct loopback access and an owner capability for settings and paid requests
  app.get('/api/ai/status', (request) => {
    if (!request.headers['x-study-owner'])
      return { available: ai.enabled(), connected: false, requiresOwner: true };
    ai.authorise(
      request.headers['x-study-owner'],
      request.ip,
      request.headers.host ?? '',
    );
    return ai.status();
  });
  for (const action of ['connect', 'test', 'disconnect', 'cancel'] as const)
    app.post('/api/ai/' + action, async (request) => {
      ai.authorise(
        request.headers['x-study-owner'],
        request.ip,
        request.headers.host ?? '',
      );
      if (action === 'connect') {
        const body = z
          .object({ key: z.string().min(16).max(512) })
          .strict()
          .parse(request.body);
        return ai.connect(body.key);
      }
      if (action === 'test') return ai.test();
      if (action === 'disconnect') return ai.disconnect();
      ai.cancel();
      return { cancelled: true };
    });
  app.post('/api/ai/feedback', async (request, reply) => {
    ai.authorise(
      request.headers['x-study-owner'],
      request.ip,
      request.headers.host ?? '',
    );
    const body = z
      .object({
        id: z.uuid(),
        lessonId: z.string(),
        taskId: z.string(),
        mode: z.enum(['review', 'explain']),
        consent: z.literal(true),
      })
      .strict()
      .parse(request.body);
    const lesson = lessons.find((lesson) => lesson.id === body.lessonId);
    const task = lesson?.tasks.find((task) => task.id === body.taskId);
    if (!lesson || !task || !['written', 'report'].includes(task.kind))
      throw new DomainError(
        'AI feedback is available only for writing and report reasoning',
      );
    const state = store.get(lesson).tasks[task.id];
    if (!state)
      throw new DomainError('Save your answer before requesting feedback');

    // Send saved writing or reasoning only, excluding factual answer keys and unrelated learner history
    const answer =
      typeof state.answer === 'string'
        ? state.answer
        : Object.fromEntries(
            task.fields
              .filter((field) => field.kind === 'reasoning')
              .map((field) => [
                field.label,
                (state.answer as Record<string, unknown>)[field.id] ?? '',
              ]),
          );
    if (
      JSON.stringify(answer).length > 4000 ||
      !(typeof answer === 'string'
        ? answer.trim()
        : Object.values(answer).some(
            (value) => typeof value === 'string' && value.trim(),
          ))
    )
      throw new DomainError('Use a saved answer of at most 4000 characters');
    const context = {
      lessonId: lesson.id,
      taskId: task.id,
      mode: body.mode,
      course: lesson.course,
      question: task.prompt,
      rubric: task.rubric,
      languageChecklist: task.languageChecklist,
      learnerAnswer: answer,
      evidence: (
        task.passage?.text ??
        (task.id === 'incident-note' &&
        lesson.id === 'cyber-network-investigation'
          ? 'Original synthetic HTTP capture: repeated HTTP requests show regular polling; process identity, intent and transfer contents are not established'
          : task.id.startsWith('case-')
            ? (lesson.material?.split(
                'Professional case — synthetic, case version 1',
              )[1] ?? '')
            : (lesson.material ??
              'No additional case evidence supplied — critique only the saved writing and rubric'))
      ).slice(0, 2500),
      existingFeedback: body.mode === 'explain' ? task.feedback : undefined,
    };

    // Cancel transport when the client leaves; a provider charge may already have occurred
    const controller = new AbortController();
    reply.raw.on('close', () => {
      if (!reply.raw.writableEnded) controller.abort();
    });
    const feedback = await ai.feedback(body.id, context, controller.signal);
    store.recordAiHelp(lesson, task.id, body.id);
    return {
      feedback,
      progress: store.get(lesson),
      label: 'AI-generated advice — not a technical grade',
    };
  });

  // Serve only built local assets and keep missing API routes distinct from missing pages
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
