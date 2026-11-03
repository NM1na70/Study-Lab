import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
// Validate the entire single-line subject; allow Conventional Commits' breaking marker.
export function validSubject(subject) {
  return (
    /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9][a-z0-9/-]*\))?!?: [^\s](?:.{0,98}[^\s])?$/.test(
      subject,
    ) && !/[\r\n]/.test(subject)
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const subject =
    process.env.PR_TITLE ??
    readFileSync(process.argv[2], 'utf8').split(/\r?\n/)[0];
  if (!validSubject(subject)) {
    console.error(
      'Use a complete Conventional Commit subject, e.g. feat(study)!: add local lessons (1–100 description characters).',
    );
    process.exitCode = 1;
  }
}
