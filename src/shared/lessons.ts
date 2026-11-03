import raw from '../../content/lessons.json' with { type: 'json' };
import { lessonSchema } from './schema.js';
export const lessons = raw.map((lesson) => lessonSchema.parse(lesson));
