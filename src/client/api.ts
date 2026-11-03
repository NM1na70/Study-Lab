import type { Lesson, Mutation, Progress } from '../shared/schema.js';

// Describe the lesson pack and shared learner progress returned together
export interface Snapshot {
  lessons: Lesson[];
  progress: Progress[];
}

// Read JSON or post a mutation and surface the server error to the saving UI
export async function request<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(
    url,
    body === undefined
      ? undefined
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
  );
  if (!response.ok) {
    const result: { error?: string } = await response.json();
    throw new Error(result.error ?? 'Request failed.');
  }
  return response.json() as Promise<T>;
}

// Keep the lesson-loading and progress-saving endpoints in one place
export const load = () => request<Snapshot>('/api/lessons');
export const save = (id: string, mutation: Mutation) =>
  request<Progress>(`/api/progress/${id}`, mutation);
