// Describe persisted review state independently from assessed lesson attempts
import type { Answer, TaskProgress } from './schema.js';

// Keep concept due times, session drafts and recorded outcomes separate from assessed lesson progress
export interface Schedule {
  concept: string;
  lessonId: string;
  taskId: string;
  contentVersion: number;
  level: number;
  dueAt: string;
  dismissed: boolean;
  assistedUntil?: string;
}
export interface ReviewItem {
  concept: string;
  state: TaskProgress;
  recorded: boolean;
  assisted?: boolean;
  skipped: boolean;
  nextDue?: string;
}
export interface ReviewSession {
  id: string;
  course: string;
  revision: number;
  index: number;
  items: ReviewItem[];
  finishedAt: string | null;
  removed?: {
    concept: string;
    index: number;
    schedule: Schedule;
    previousMarker: number;
  };
}
export interface ReviewSnapshot {
  due: Schedule[];
  count: number;
  active: ReviewSession[];
  now: string;
}
export type ReviewMutation = {
  revision: number;
  action:
    | 'draft'
    | 'check'
    | 'hint'
    | 'solution'
    | 'next'
    | 'skip'
    | 'finish'
    | 'dismiss'
    | 'undo';
  answer?: Answer;
};

// Use elapsed UTC intervals with no streaks or penalty for lateness
export function nextSchedule(
  previous: Schedule,
  correct: boolean,
  assisted: boolean,
  now: Date,
): Schedule {
  const intervals = [1, 3, 7, 14, 30];
  const level =
    correct && !assisted
      ? Math.min(previous.level + 1, intervals.length - 1)
      : 0;
  const delay = !correct
    ? 10 * 60_000
    : assisted
      ? 60 * 60_000
      : intervals[level] * 86_400_000;
  return {
    ...previous,
    level,
    dueAt: new Date(now.getTime() + delay).toISOString(),
  };
}
