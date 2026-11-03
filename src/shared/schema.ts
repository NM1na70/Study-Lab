import { z } from 'zod';

// Require enough source metadata to explain provenance and permitted reuse
export const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.url(),
  accessed: z.iso.date(),
  supports: z.string().min(20),
  attribution: z.string().min(10),
});

// Validate activity content, feedback, progressive hints, and marking or self-review support
export const taskSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]+$/),
    kind: z.enum(['exact', 'written']),
    stage: z.enum(['practice', 'independent', 'review']),
    prompt: z.string().min(10),
    answers: z.array(z.string().min(1)),
    normalise: z.enum(['trim', 'case-space']),
    hints: z.array(z.string().min(5)).min(2),
    explanation: z.string().min(20),
    feedback: z.string().min(20),
    example: z.string().min(1),
    rubric: z.array(z.string().min(5)),
    languageChecklist: z.array(z.string().min(5)),
    sourceIds: z.array(z.string()).min(1),
  })
  .superRefine((t, c) => {
    // Precise activities need answer keys, while writing needs an explicit self-review rubric
    if (t.kind === 'exact' && !t.answers.length)
      c.addIssue({ code: 'custom', message: 'Exact task needs answers' });
    if (t.kind === 'written' && !t.rubric.length)
      c.addIssue({ code: 'custom', message: 'Written task needs a rubric' });
  });

// Define the versioned lesson pack separately from its rendering and saved progress
export const lessonSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]+$/),
  version: z.number().int().positive(),
  course: z.enum(['English', 'Cybersecurity']),
  title: z.string().min(5),
  summary: z.string().min(20),
  difficulty: z.enum(['Low', 'Medium', 'High']),
  minutes: z.number().int().positive(),
  order: z.number().int().positive(),
  topics: z.array(z.string()).min(1),
  objectives: z.array(z.string()).min(2),
  prerequisites: z.array(z.string()).min(1),
  teaching: z
    .array(
      z.object({
        title: z.string(),
        body: z.string().min(30),
        sourceIds: z.array(z.string()).min(1),
      }),
    )
    .min(3),
  tasks: z.array(taskSchema).min(3),
  sources: z.array(sourceSchema).min(1),
  evidence: z.string().optional(),
});

// Share parsed content types and the persisted attempt and lesson progress contracts
export type Lesson = z.infer<typeof lessonSchema>;
export type Task = z.infer<typeof taskSchema>;
export interface TaskProgress {
  attemptLog?: { answer: string; correct: boolean; checkedAt: string }[];
  answer: string;
  attempts: number;
  correct: boolean;
  hints: number;
  solution: boolean;
  reviewed: boolean;
  mistakes: number;
}
export interface Progress {
  lessonId: string;
  contentVersion: number;
  revision: number;
  step: number;
  tasks: Record<string, TaskProgress>;
  completedAt: string | null;
  updatedAt: string | null;
}

// Bound incoming answers and reject unknown fields before domain rules inspect the action
export const mutationSchema = z
  .object({
    revision: z.number().int().nonnegative(),
    action: z.enum([
      'draft',
      'check',
      'hint',
      'solution',
      'selfReview',
      'step',
      'complete',
    ]),
    taskId: z.string().optional(),
    answer: z.string().max(10000).optional(),
    step: z.number().int().nonnegative().optional(),
  })
  .strict();
export type Mutation = z.infer<typeof mutationSchema>;
