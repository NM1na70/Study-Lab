// Import the validation primitives shared by content loading and API requests
import { z } from 'zod';

// Require source metadata for content provenance and permitted reuse
export const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.url(),
  accessed: z.iso.date(),
  supports: z.string().min(20),
  attribution: z.string().min(10),
});

// Validate stable field and option identities used by typed report controls
const idSchema = z.string().regex(/^[a-z][a-z0-9-]+$/);
const optionSchema = z.object({ id: idSchema, label: z.string().min(1) });
const normaliseSchema = z.enum(['trim', 'case-space']);
export const fieldSchema = z.object({
  id: idSchema,
  label: z.string().min(3),
  kind: z.enum(['short', 'select', 'multiple', 'reasoning']),
  answers: z.array(z.string().min(1)),
  example: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  hint: z.string().min(5),
  options: z.array(optionSchema),
  normalise: normaliseSchema,
  feedback: z.string().min(10),
});

// Keep answer identities typed rather than relying on displayed option labels
export const answerSchema = z.union([
  z.string().max(10000),
  z.array(z.string().max(100)).max(20),
  z
    .record(
      idSchema,
      z.union([z.string().max(2000), z.array(z.string().max(100)).max(20)]),
    )
    .refine((v) => Object.keys(v).length <= 20),
]);
export type ReportValue = string | string[];
export type ReportAnswer = Record<string, ReportValue>;
export type Answer = z.infer<typeof answerSchema>;

// Describe assessment, reading snapshots, quiz estimates and controlled finding relationships together
export const taskSchema = z
  .object({
    tier: z
      .enum([
        'University Intermediate',
        'Junior Professional',
        'Advanced Challenge',
      ])
      .optional(),
    quiz: z
      .object({
        difficulty: z.enum(['Easy', 'Medium', 'Hard']),
        minutes: z.number().int().min(1).max(120),
        group: z.string(),
        desktop: z.boolean().default(false),
      })
      .optional(),
    labScenario: z.literal('defence-v1').optional(),
    passage: z
      .object({
        id: z.string(),
        version: z.number().int().positive(),
        title: z.string(),
        publisher: z.string(),
        url: z.url(),
        published: z.string(),
        retrieved: z.string(),
        reuse: z.string(),
        difficulty: z.enum(['Medium', 'Hard']),
        text: z.string().min(100),
      })
      .optional(),
    id: idSchema,
    kind: z.enum([
      'exact',
      'written',
      'choice',
      'select',
      'multiple',
      'report',
    ]),
    stage: z.enum(['practice', 'independent', 'review']),

    // Keep authored exercise text and display casing separate from assessment keys
    prompt: z.string().min(10),
    exercise: z.string().min(1).optional(),
    instructions: z.array(z.string().min(1)).default([]),
    solutionDisplay: z.enum(['preserve', 'sentence']).default('preserve'),
    answers: z.array(z.string().min(1)),
    normalise: normaliseSchema,
    hints: z.array(z.string().min(5)).min(2),
    explanation: z.string().min(20),
    feedback: z.string().min(20),
    example: z.string().min(1),
    rubric: z.array(z.string().min(5)),
    languageChecklist: z.array(z.string().min(5)),
    sourceIds: z.array(z.string()).min(1),
    options: z.array(optionSchema).default([]),
    fields: z.array(fieldSchema).default([]),
    emphasis: z.array(z.string().min(1)).default([]),
    reportRules: z
      .array(
        z.object({
          assessmentId: idSchema,
          evidenceIds: z.array(idSchema).min(1),
          frameIds: z.array(idSchema).min(1),
        }),
      )
      .default([]),
    reportLayout: z
      .array(
        z.object({
          title: z.string().min(3),
          sentences: z.array(z.string().min(3)).min(1),
        }),
      )
      .default([]),
    reviewConcept: z
      .string()
      .regex(/^[a-z][a-z0-9-]+$/)
      .optional(),
    findingMappings: z
      .array(z.object({ taskId: idSchema, fieldId: idSchema }))
      .default([]),
  })
  .superRefine((task, c) => {
    if (
      ['exact', 'choice', 'select', 'multiple'].includes(task.kind) &&
      !task.answers.length
    )
      c.addIssue({ code: 'custom', message: 'Precise tasks need answer keys' });
    if (['written', 'report'].includes(task.kind) && !task.rubric.length)
      c.addIssue({ code: 'custom', message: 'Self-review requires a rubric' });
    if (task.kind === 'report' && !task.fields.length)
      c.addIssue({
        code: 'custom',
        message: 'Reports require structured fields',
      });
  });

// Bind versioned activities to course metadata, teaching, sources and bundled evidence
export const lessonSchema = z.object({
  previousVersion: z.number().int().positive().optional(),
  id: idSchema,
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
  evidenceKind: z.enum(['pcap', 'json', 'text']).default('pcap'),
  material: z.string().optional(),
  resources: z
    .array(
      z.object({ label: z.string(), url: z.string().regex(/^\/evidence\//) }),
    )
    .default([]),
});
export type Lesson = z.infer<typeof lessonSchema>;
export type Task = z.infer<typeof taskSchema>;
export type ReportField = z.infer<typeof fieldSchema>;

// Preserve earlier work and legitimate completion history when activity structures change
export interface PreviousWork {
  contentVersion: number;
  answer: Answer;
  correct: boolean;
  reviewed: boolean;
  hints: number;
  solution: boolean;
  aiHelp?: number;
}
export interface TaskProgress {
  answer: Answer;
  attempts: number;
  correct: boolean;
  checked?: boolean;
  hints: number;
  solution: boolean;
  aiHelp?: number;
  reviewed: boolean;
  mistakes: number;
  attemptLog?: {
    answer: Answer;
    correct: boolean;
    checkedAt: string;
    contentVersion?: number;
  }[];
  previousWork?: PreviousWork[];
  reviewDismissedMistakes?: number;
  fieldResults?: Record<string, boolean>;
  findingProvenance?: Record<
    string,
    {
      sourceTaskId: string;
      answer: Answer;
      status: 'Not Checked' | 'Checked — Incorrect' | 'Checked — Correct';
    }
  >;
}
export interface Progress {
  reviewDueCount?: number;
  lessonId: string;
  contentVersion: number;
  revision: number;
  step: number;
  tasks: Record<string, TaskProgress>;
  completedAt: string | null;
  updatedAt: string | null;
  completionHistory?: {
    contentVersion: number;
    completedAt: string;
    assisted: boolean;
  }[];
}

// Bound incoming drafts and leave task-specific shape validation to the domain boundary
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
      'dismissReview',
      'restoreReview',
      'useFinding',
    ]),
    taskId: z.string().optional(),
    sourceTaskId: z.string().optional(),
    answer: answerSchema.optional(),
    step: z.number().int().nonnegative().optional(),
  })
  .strict();
export type Mutation = z.infer<typeof mutationSchema>;
