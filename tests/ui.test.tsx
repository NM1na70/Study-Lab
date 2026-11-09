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
  await user.click(screen.getByRole('button', { name: 'Check Answer' }));
  expect(enqueue.mock.calls.at(-2)?.[0]).toMatchObject({
    action: 'draft',
    answer: 'action',
  });
  expect(enqueue.mock.calls.at(-1)?.[0]).toMatchObject({ action: 'check' });
  expect(
    screen.queryByText('Full Solution', { exact: true }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Next Hint/ }));
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
  expect(screen.getByText('Correct')).toBeVisible();
  expect(screen.getByText(/Hint 1/)).toBeVisible();
  expect(screen.getByText('Full Solution', { exact: true })).toBeVisible();
});

// Keep written review explicit and retain the draft when saving fails before the action
it('requires explicit written self-review and preserves unsaved state on failed save', async () => {
  const user = userEvent.setup();
  const enqueue = vi.fn().mockResolvedValue(false);
  const task = lessons[0].tasks.find((t) => t.kind === 'written')!;
  render(<TaskCard task={task} enqueue={enqueue} />);
  expect(
    screen.getByRole('button', { name: 'Record Self-Review' }),
  ).toBeDisabled();
  await user.type(
    screen.getByLabelText('Your answer'),
    'The connection failed. My next action is to check the cable.',
  );
  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button', { name: 'Record Self-Review' }));
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
  await userEvent.click(screen.getByRole('button', { name: 'Check Answer' }));
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

// Require separate intentional Enter presses and leave composition and multiline input alone
it('focuses Check Answer first, suppresses held Enter and IME, then saves before a deliberate second Enter', async () => {
  const user = userEvent.setup();
  const enqueue = vi.fn().mockResolvedValue(true);
  render(<TaskCard task={lessons[0].tasks[0]} enqueue={enqueue} />);
  const input = screen.getByLabelText('Your answer');
  fireEvent.change(input, { target: { value: 'action' } });
  input.focus();
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true, keyCode: 229 });
  expect(input).toHaveFocus();
  expect(enqueue).not.toHaveBeenCalled();
  fireEvent.compositionStart(input);
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(input).toHaveFocus();
  fireEvent.compositionEnd(input);
  await user.keyboard('{Enter>}');
  const button = screen.getByRole('button', { name: 'Check Answer' });
  expect(button).toHaveFocus();
  fireEvent.keyDown(button, { key: 'Enter', repeat: true });
  expect(enqueue).not.toHaveBeenCalled();
  await user.keyboard('{/Enter}');
  await user.keyboard('{Enter}');
  expect(enqueue.mock.calls.map((call) => call[0].action)).toEqual([
    'draft',
    'check',
  ]);
});

// Reports autosave structured field IDs and do not redirect Enter away from reasoning text
it('autosaves a report object and preserves multiline Enter behavior', async () => {
  const task = lessons[1].tasks.find((task) => task.kind === 'report')!;
  const enqueue = vi.fn().mockResolvedValue(true);
  render(<TaskCard task={task} enqueue={enqueue} />);
  fireEvent.change(screen.getByLabelText(/Source Host/), {
    target: { value: '192.0.2.10' },
  });
  fireEvent.change(
    screen.getByLabelText(/Why This Evidence Supports Your Assessment/),
    {
      target: { value: 'Three requests' },
    },
  );
  await waitFor(() =>
    expect(enqueue).toHaveBeenCalledWith({
      action: 'draft',
      taskId: task.id,
      answer: { source: '192.0.2.10', 'assessment-reason': 'Three requests' },
    }),
  );
  const input = screen.getByLabelText(
    /Why This Evidence Supports Your Assessment/,
  );
  input.focus();
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(input).toHaveFocus();
});

// Keep one checking action in flight even when activation is repeated before the draft saves
it('does not enqueue duplicate checks while the preceding save is pending', async () => {
  let release: (value: boolean) => void = () => {};
  const enqueue = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          release = resolve;
        }),
    )
    .mockResolvedValue(true);
  render(<TaskCard task={lessons[0].tasks[0]} enqueue={enqueue} />);
  fireEvent.change(screen.getByLabelText('Your answer'), {
    target: { value: 'action' },
  });
  const button = screen.getByRole('button', { name: 'Check Answer' });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(enqueue).toHaveBeenCalledTimes(1);
  release(true);
  await waitFor(() => expect(enqueue).toHaveBeenCalledTimes(2));
  expect(enqueue.mock.calls.map((call) => call[0].action)).toEqual([
    'draft',
    'check',
  ]);
});

// Exercise explicit authored display metadata while preserving technical keys and safe escaped exercise text
it('separates instructions and exercises and formats common-word solutions without changing technical values', async () => {
  const { QuestionPrompt, solutionAnswer, SolutionAnswer } =
    await import('../src/client/QuestionPresentation');
  const email = lessons.find(
    (lesson) => lesson.id === 'english-workplace-emails',
  )!;
  const word = email.tasks.find((task) => task.id === 'request-word')!;
  const view = render(<QuestionPrompt task={word} />);
  expect(
    screen.getByRole('heading', { name: word.prompt }),
  ).not.toHaveTextContent('___');
  expect(view.container.querySelector('blockquote')).toHaveTextContent(
    '___ send the revised list',
  );
  const recipient = email.tasks.find((task) => task.id === 'review-recipient')!;
  expect(solutionAnswer(recipient)).toBe('Recipient');
  expect(recipient.answers).toEqual(['recipient']);
  for (const [lessonId, taskId, expected] of [
    ['cyber-network-investigation', 'request-path', '/checkin?host=lab-01'],
    ['cyber-cloud-iam', 'action', 's3:GetObject'],
    ['cyber-endpoint-correlation', 'image', 'C:/Lab/updater.exe'],
    ['cyber-endpoint-correlation', 'guid', 'proc-alpha'],
    ['cyber-dns-behaviour', 'negative-code', 'NXDOMAIN'],
  ]) {
    const task = lessons
      .find((lesson) => lesson.id === lessonId)!
      .tasks.find((task) => task.id === taskId)!;
    expect(solutionAnswer(task)).toBe(expected);
  }
  view.rerender(<SolutionAnswer task={recipient} />);
  expect(screen.getByText('Recipient').tagName).toBe('STRONG');
  view.rerender(
    <QuestionPrompt
      task={{ ...word, exercise: '<img src=x onerror=alert(1)>' }}
    />,
  );
  expect(view.container.querySelector('img')).toBeNull();
  expect(view.container).toHaveTextContent('<img src=x onerror=alert(1)>');
});

// Keep professional email paragraphs and report model fields separate from learner-authored preview content
it('renders email paragraphs and labelled structured examples with no learner-grade labels', async () => {
  const { SolutionAnswer } = await import('../src/client/QuestionPresentation');
  const email = lessons.find(
    (lesson) => lesson.id === 'english-workplace-emails',
  )!;
  const task = email.tasks.find((task) => task.id === 'email')!;
  const view = render(<SolutionAnswer task={task} />);
  expect(view.container.querySelector('.written-example')?.textContent).toBe(
    task.example,
  );
  expect(task.example).toContain('Hi Jo,\n\n');
  expect(task.example).toContain('15:00 AEST today.');
  expect(task.example).toContain('\n\nThank you');
  for (const lesson of lessons)
    for (const report of lesson.tasks.filter(
      (task) => task.kind === 'report',
    )) {
      view.rerender(<SolutionAnswer task={report} />);
      const fields = view.container.querySelectorAll(
        '.example-report-fields > li',
      );
      expect(fields).toHaveLength(report.fields.length);
      for (const field of fields)
        expect(field.querySelector('strong')).not.toBeNull();
      expect(view.container).not.toHaveTextContent('— Correct');
      expect(view.container).not.toHaveTextContent('— Wrong');
      expect(view.container).not.toHaveTextContent('name the passage detail');
    }
});

// Require objective feedback for submitted fields and remove that feedback immediately when the draft changes
it('labels correct, wrong and missing report fields while keeping reasoning explicitly self-reviewed', async () => {
  const { CheckedReportFeedback } =
    await import('../src/client/QuestionPresentation');
  const { reportResults } = await import('../src/shared/domain.js');
  const task = lessons
    .find((lesson) => lesson.id === 'english-workplace-emails')!
    .tasks.find((task) => task.passage)!;
  const state = {
    ...emptyTask(task),
    answer: { main: 'main', publisher: 'Wrong publisher' },
    attempts: 1,
    checked: true,
  };
  const checked = { ...state, fieldResults: reportResults(task, state.answer) };
  const view = render(<CheckedReportFeedback task={task} state={checked} />);
  const rows = [...view.container.querySelectorAll('li')];
  expect(
    rows.find((row) => row.textContent?.includes('Main Point')),
  ).toHaveTextContent('— Correct');
  expect(
    rows.find((row) => row.textContent?.includes('Publisher')),
  ).toHaveTextContent('Wrong publisher — Wrong');
  expect(
    rows.find((row) => row.textContent?.includes('Fill In The Gap')),
  ).toHaveTextContent('— Not Answered');
  expect(screen.getByText(/Reasoning:/)).toHaveTextContent(
    'Self-Review Required — Not Automatically Graded',
  );
  view.rerender(
    <TaskCard
      task={task}
      state={checked}
      enqueue={vi.fn().mockResolvedValue(true)}
    />,
  );
  fireEvent.change(screen.getByLabelText('Publisher', { exact: true }), {
    target: { value: 'edited publisher' },
  });
  expect(view.container.querySelector('.checked-report-fields')).toBeNull();
  expect(
    screen.getByText('Answer changed — check again to update feedback'),
  ).toBeVisible();
});

// A completed course must not block the other course or announce global completion prematurely
it('shows course-specific completion and reserves global congratulations for both completed courses', async () => {
  const { DailyQuiz } = await import('../src/client/DailyQuiz');
  const { exampleAnswer } = await import('../src/shared/domain.js');
  const progress = lessons.map((lesson) => ({
    ...emptyProgress(lesson),
    tasks: Object.fromEntries(
      lesson.tasks.map((task) => [
        task.id,
        {
          ...emptyTask(task),
          answer: exampleAnswer(task),
          correct: lesson.course === 'English',
          reviewed: lesson.course === 'English',
        },
      ]),
    ),
  }));
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'course-completion',
          revision: 1,
          items: [],
          policy: 'course-7',
        }),
      ),
    ),
  );
  const view = render(
    <DailyQuiz data={{ lessons, progress }} onChange={vi.fn()} />,
  );
  expect(screen.getByText('All English Questions Completed')).toBeVisible();
  expect(screen.queryByText(/Congratulations/)).toBeNull();
  await userEvent.click(screen.getByRole('tab', { name: /Cybersecurity/ }));
  expect(
    screen.queryByText('All Cybersecurity Questions Completed'),
  ).toBeNull();
  view.rerender(
    <DailyQuiz
      data={{
        lessons,
        progress: progress.map((saved) => ({
          ...saved,
          tasks: Object.fromEntries(
            Object.entries(saved.tasks).map(([id, state]) => [
              id,
              { ...state, correct: true, reviewed: true },
            ]),
          ),
        })),
      }}
      onChange={vi.fn()}
    />,
  );
  expect(
    screen.getByText('Congratulations! You Have Completed All Questions'),
  ).toBeVisible();
});
