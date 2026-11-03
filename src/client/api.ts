import type { Lesson, Mutation, Progress } from '../shared/schema.js';
export interface Snapshot {
  lessons: Lesson[];
  progress: Progress[];
}
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
export const load = () => request<Snapshot>('/api/lessons');
export const save = (id: string, mutation: Mutation) =>
  request<Progress>(`/api/progress/${id}`, mutation);
