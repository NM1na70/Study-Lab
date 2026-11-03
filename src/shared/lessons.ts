import raw from '../../content/lessons.json' with { type: 'json' };
import { lessonSchema } from './schema.js';

// Parse bundled content at startup so malformed lessons cannot silently enter the app
export const lessons = raw.map((lesson) => lessonSchema.parse(lesson));
