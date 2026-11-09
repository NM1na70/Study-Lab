// Build validated immutable reading snapshots from one fixed public-domain event feed without AI or arbitrary URLs
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Store } from './store.js';
import { taskSchema, type Lesson, type Task } from '../shared/schema.js';
import { assisted, DomainError } from '../shared/domain.js';

// Restrict ingestion to the fixed USGS feed and validate linked event origins
const endpoint =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson';
const eventSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  properties: z.object({
    title: z.string().min(5).max(300),
    place: z.string().min(1).max(300),
    mag: z.number().min(-2).max(10),
    time: z.number().int().positive(),
    updated: z.number().int().positive().optional(),
    url: z
      .url()
      .refine((url) => new URL(url).origin === 'https://earthquake.usgs.gov'),
  }),
});

// Reattach persisted tasks at startup so their passages and answer keys remain available offline
export class News {
  private busy = false;
  constructor(
    private store: Store,
    private catalogue: Lesson[],
    private transport: typeof fetch = fetch,
  ) {
    for (const row of store.db
      .prepare('SELECT state FROM news_snapshots ORDER BY id')
      .all())
      this.attach(taskSchema.parse(JSON.parse(String(row.state))));
  }

  // Add missing source and task identities without replacing an existing catalogue entry
  private attach(task: Task) {
    const lesson = this.catalogue.find(
      (lesson) => lesson.id === 'english-evidence-language',
    )!;
    if (!lesson.sources.some((source) => source.id === 'usgs-source'))
      lesson.sources.push({
        id: 'usgs-source',
        title: 'USGS GeoJSON event feed',
        url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php',
        accessed: '2026-11-06',
        supports:
          'Reported event time, magnitude and location; no inference about local impact is graded',
        attribution:
          'Public-domain USGS event facts, credited to USGS; no third-party media copied',
      });
    if (!lesson.tasks.some((existing) => existing.id === task.id))
      lesson.tasks.push(task);
  }

  // Bound concurrent fetching, redirects, response bytes and retained snapshots before publication
  async update() {
    if (this.busy)
      throw new DomainError('A news update is already running', 429);
    this.busy = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      if (
        Number(
          this.store.db
            .prepare('SELECT count(*) AS n FROM news_snapshots')
            .get()?.n,
        ) >= 20
      )
        throw new DomainError(
          'Twenty news snapshots are retained — use existing reading before importing more',
        );
      const response = await this.transport(endpoint, {
        signal: controller.signal,
        redirect: 'error',
      });
      if (!response.ok) throw new Error('Feed unavailable');
      if (!response.body) throw new Error('Empty feed');
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const next = await reader.read();
          if (next.done) break;
          size += next.value.length;
          if (size > 262144) throw new Error('Feed exceeds limit');
          chunks.push(next.value);
        }
      } finally {
        await reader.cancel();
      }
      const bytes = Buffer.concat(chunks);
      const feed = z
        .object({
          type: z.literal('FeatureCollection'),
          features: z.array(z.unknown()).max(1000),
        })
        .parse(JSON.parse(Buffer.from(bytes).toString('utf8')));
      const parsed = feed.features
        .map((event) => eventSchema.parse(event))
        .sort((a, b) => b.properties.time - a.properties.time)[0];
      if (!parsed) throw new Error('No significant events in this weekly feed');
      const p = parsed.properties;

      // Keep event occurrence distinct from the feed report update and retrieval metadata
      const published = new Date(p.time).toISOString();
      if (p.time > Date.now() + 86400000) throw new Error('Future event time');
      const text = `USGS event snapshot — retrieved ${new Date().toISOString()}\nReported title: ${p.title}\nReported location: ${p.place}\nReported magnitude: ${p.mag}\nEvent time in UTC: ${published}\n\nThis is a stored reading snapshot of a public earthquake report, not a local warning. The event time is distinct from retrieval time. Magnitude alone does not establish local damage, casualties or what an individual felt. The feed may later revise its estimates; this question continues to use these exact stored values. Compare the numerical observation with a claim about impact, and identify what additional local evidence would be required before making that claim. The explanatory wording is original Study Lab material, separate from the reported feed fields`;

      // Derive a stable task identity from the validated event rather than rewriting an existing passage
      const id =
        'fresh-' +
        createHash('sha256')
          .update(JSON.stringify(parsed))
          .digest('hex')
          .slice(0, 20);
      const template = this.catalogue
        .flatMap((lesson) => lesson.tasks)
        .find((task) => task.passage)!;
      const fields = template.fields.slice(0, 0);
      for (const [field, label, value] of [
        ['location', 'Reported Location', p.place],
        ['magnitude', 'Reported Magnitude', String(p.mag)],
        ['event-time', 'Event Time In UTC', published],
      ] as const)
        fields.push({
          id: field,
          label,
          kind: 'short',
          answers: [value],
          example: value,
          hint: 'Read the exact field in the stored snapshot',
          options: [],
          normalise: 'case-space',
          feedback:
            'Use this snapshot value rather than a live page that may have changed',
        });
      fields.push({
        id: 'interpretation',
        label: 'Evidence And Limits',
        kind: 'reasoning',
        answers: [],
        example:
          'The report gives a location, magnitude and event time — it does not establish local impact without further evidence',
        hint: 'Separate the feed observation from impact claims',
        options: [],
        normalise: 'case-space',
        feedback: 'Explain the limit and name the evidence needed',
      });
      const task = taskSchema.parse({
        ...template,
        id,
        prompt: 'Fresh news reading — ' + p.title,
        exercise: undefined,
        instructions: [
          'Use the stored snapshot for factual answers and review the interpretation separately',
        ],
        solutionDisplay: 'preserve',
        sourceIds: ['usgs-source'],
        fields,
        reportLayout: [
          {
            title: 'Snapshot Findings',
            sentences: [
              'Location: {location}',
              'Magnitude: {magnitude}',
              'Event time: {event-time}',
              'Interpretation: {interpretation}',
            ],
          },
        ],
        passage: {
          id,
          version: 1,
          title: p.title,
          publisher: 'USGS',
          url: p.url,
          published: p.updated
            ? 'Original publication time not supplied; report updated ' +
              new Date(p.updated).toISOString()
            : 'Original publication time not supplied by feed',
          retrieved: new Date().toISOString(),
          reuse:
            'Public-domain USGS event facts and original Study Lab analysis — no third-party article copied',
          difficulty: 'Medium',
          text,
        },
        quiz: { difficulty: 'Medium', minutes: 15, group: id },
      });

      // Store the snapshot and archive any superseded lesson completion in the same transaction
      this.store.db.exec('BEGIN IMMEDIATE');
      try {
        const inserted = this.store.db
          .prepare('INSERT OR IGNORE INTO news_snapshots VALUES (?,?)')
          .run(id, JSON.stringify(task));
        if (inserted.changes) {
          const lesson = this.catalogue.find(
            (lesson) => lesson.id === 'english-evidence-language',
          )!;
          const progress = this.store.get(lesson);
          if (progress.completedAt) {
            (progress.completionHistory ??= []).push({
              contentVersion: progress.contentVersion,
              completedAt: progress.completedAt,
              assisted: assisted(progress),
            });
            progress.completedAt = null;
            progress.revision++;
            this.store.db
              .prepare('UPDATE progress SET state=? WHERE lesson_id=?')
              .run(JSON.stringify(progress), lesson.id);
          }
        }
        this.store.db.exec('COMMIT');
      } catch (error) {
        this.store.db.exec('ROLLBACK');
        throw error;
      }
      this.attach(task);
      return {
        message:
          'Validated snapshot added — existing passages and answers are unchanged',
        id,
      };
    } catch (error) {
      // Report import failure without deleting previously stored reading or learner answers
      if (error instanceof DomainError) throw error;
      throw new DomainError(
        'News update failed — previous offline reading remains available',
        502,
      );
    } finally {
      clearTimeout(timer);
      this.busy = false;
    }
  }
}
