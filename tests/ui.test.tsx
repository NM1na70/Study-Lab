// @vitest-environment jsdom
// Import the UI test tools, study components, and real lesson defaults
import { afterEach, expect, it, vi } from 'vitest';
import {
  cleanup,
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { TaskCard } from '../src/client/TaskCard';
import { App } from '../src/client/App';
import { lessons } from '../src/shared/lessons.js';
import { emptyProgress, emptyTask } from '../src/shared/domain.js';

// Reset the DOM, mocked globals, and route so one UI scenario cannot affect the next
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  location.hash = '';
});

// Check draft-before-action ordering and reveal feedback only through the matching saved state
it('answers, saves before checking and provides progressive hints and explicit solutions', async () => {
  const user = userEvent.setup();
  const enqueue = vi.fn().mockResolvedValue(true);
  const { rerender } = render(
    <TaskCard task={lessons[0].tasks[0]} enqueue={enqueue} />,
  );
  await user.type(screen.getByLabelText('Your answer'), 'action');
  await user.click(screen.getByRole('button', { name: 'Check answer' }));
  expect(enqueue.mock.calls.at(-2)?.[0]).toMatchObject({
    action: 'draft',
    answer: 'action',
  });
  expect(enqueue.mock.calls.at(-1)?.[0]).toMatchObject({ action: 'check' });
  expect(
    screen.queryByText('Full solution', { exact: true }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Next hint/ }));
  expect(enqueue).toHaveBeenLastCalledWith({
    action: 'hint',
    taskId: 'action',
  });
  rerender(
    <TaskCard
      task={lessons[0].tasks[0]}
      state={{
        ...emptyTask(),
        answer: 'action',
        attempts: 1,
        correct: true,
        hints: 1,
        solution: true,
      }}
      enqueue={enqueue}
    />,
  );
  expect(screen.getByText('Correct.')).toBeVisible();
  expect(screen.getByText(/Hint 1/)).toBeVisible();
  expect(screen.getByText('Full solution', { exact: true })).toBeVisible();
});

// Keep written review explicit and retain the draft when saving fails before the action
it('requires explicit written self-review and preserves unsaved state on failed save', async () => {
  const user = userEvent.setup();
  const enqueue = vi.fn().mockResolvedValue(false);
  const task = lessons[0].tasks.find((t) => t.kind === 'written')!;
  render(<TaskCard task={task} enqueue={enqueue} />);
  expect(
    screen.getByRole('button', { name: 'Record self-review' }),
  ).toBeDisabled();
  await user.type(
    screen.getByLabelText('Your answer'),
    'The connection failed. My next action is to check the cable.',
  );
  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button', { name: 'Record self-review' }));
  expect(screen.getByText(/Unsaved edits/)).toBeVisible();
  expect(enqueue).not.toHaveBeenCalledWith(
    expect.objectContaining({ action: 'selfReview' }),
  );
});

// Delay initial loading and reject later writes to inspect loading, real counts, and retained error-state text
it('shows actual progress, loading and save error states', async () => {
  const p = emptyProgress(lessons[0]);
  p.tasks.action = { ...emptyTask(), answer: 'action', correct: true };
  p.step = 1;
  let resolveLoad: (value: Response) => void = () => {};
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<Response>((r) => {
            resolveLoad = r;
          }),
      )
      .mockResolvedValue(
        new Response(JSON.stringify({ error: 'Disk unavailable' }), {
          status: 500,
        }),
      ),
  );
  location.hash = '#/lesson/' + lessons[0].id;
  render(<App />);
  expect(screen.getByText(/Loading your lessons/)).toBeVisible();
  resolveLoad(
    new Response(
      JSON.stringify({ lessons, progress: [p, emptyProgress(lessons[1])] }),
    ),
  );
  await screen.findByText('1/8 activities met');
  fireEvent.change(screen.getByLabelText('Your answer'), {
    target: { value: 'acttion' },
  });
  await userEvent.click(screen.getByRole('button', { name: 'Check answer' }));
  await waitFor(() => expect(screen.getByText('Save error')).toBeVisible());
  expect(screen.getByRole('alert')).toHaveTextContent('Disk unavailable');
  expect(screen.getByLabelText('Your answer')).toHaveValue('acttion');
});

// Hold the first response to prove a newer edit waits and uses the confirmed next revision
it('serialises delayed saves so a quick newer edit cannot be overwritten', async () => {
  const { renderHook, act } = await import('@testing-library/react');
  const { useProgress } = await import('../src/client/use-progress');
  const initial = emptyProgress(lessons[0]);
  const first = {
    ...initial,
    revision: 1,
    tasks: { action: { ...emptyTask(), answer: 'first' } },
  };
  const second = {
    ...first,
    revision: 2,
    tasks: { action: { ...emptyTask(), answer: 'action' } },
  };

  // Release the first response manually so the queue ordering is observed rather than assumed
  let release: (response: Response) => void = () => {};
  const fetchMock = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
    )
    .mockResolvedValueOnce(new Response(JSON.stringify(second)));
  vi.stubGlobal('fetch', fetchMock);
  const changed = vi.fn();
  const { result } = renderHook(() => useProgress(initial, changed));
  let completed: Promise<boolean>[] = [];
  act(() => {
    completed = [
      result.current.enqueue({
        action: 'draft',
        taskId: 'action',
        answer: 'first',
      }),
      result.current.enqueue({
        action: 'draft',
        taskId: 'action',
        answer: 'action',
      }),
    ];
  });
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  expect(result.current.status).toBe('Saving…');
  await act(async () => {
    release(new Response(JSON.stringify(first)));
    await Promise.all(completed);
  });
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
    revision: 1,
    answer: 'action',
  });
  expect(changed).toHaveBeenLastCalledWith(second);
  expect(result.current.status).toBe('Saved');
});
