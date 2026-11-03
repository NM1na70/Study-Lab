import { it, expect } from 'vitest';
// @ts-expect-error This executable hook intentionally uses plain JS for Git/Node.
import { validSubject } from '../scripts/check-commit-msg.mjs';

// Cover accepted breaking-change subjects and reject malformed, multiline, or oversized subjects
it('validates the complete Conventional Commit subject including breaking changes', () => {
  for (const s of [
    'feat: x',
    'feat: add lessons',
    'feat!: change storage',
    'fix(api)!: validate progress',
    'docs: explain backups',
  ])
    expect(validSubject(s), s).toBe(true);
  for (const s of [
    'add lessons',
    'feat: ',
    'feat : bad',
    'feat: good\ninjected',
    'feat: trailing ',
    'feat(scope)!!: bad',
    'feat: ' + 'x'.repeat(101),
  ])
    expect(validSubject(s), s).toBe(false);
});
