// Run a bounded model of endpoint, identity and network defence without executing operating-system commands
import type { Store } from './store.js';
import { DomainError } from '../shared/domain.js';
import { labObjectives, type LabState } from '../shared/lab.js';
export type { LabState } from '../shared/lab.js';

// Persist one revisioned scenario model, without a shell, VM or external network
export class Lab {
  constructor(
    private store: Store,
    private now: () => number = Date.now,
  ) {
    // Pause interrupted models rather than counting server downtime as scenario activity
    const state = this.read();
    if (state.running) {
      state.running = false;
      state.updated = this.now();
      state.revision++;
      state.history.push({
        at: Math.floor(state.elapsed),
        action: 'interrupted',
        output: 'Server restarted — model paused without advancing downtime',
      });
      this.store.db
        .prepare('UPDATE lab_state SET state=? WHERE id=1')
        .run(JSON.stringify(state));
    }
  }

  // Construct only fictional local resources and leave the scenario clock stopped
  private fresh(): LabState {
    return {
      revision: 0,
      elapsed: 0,
      running: false,
      updated: this.now(),
      blocked: false,
      accountDisabled: false,
      processStopped: false,
      serviceAvailable: true,
      assisted: false,
      history: [],
    };
  }

  // Read the saved model without advancing its clock
  read(): LabState {
    const row = this.store.db
      .prepare('SELECT state FROM lab_state WHERE id=1')
      .get();
    return row ? (JSON.parse(String(row.state)) as LabState) : this.fresh();
  }

  // Apply each model action under a write lock and roll back stale or unsupported operations
  update(revision: number, action: string, command = ''): LabState {
    this.store.db.exec('BEGIN IMMEDIATE');
    try {
      let state = this.read();
      if (state.revision !== revision)
        throw new DomainError(
          'Lab changed in another tab — reload its state',
          409,
        );

      // Advance only running scenario time, capped at thirty minutes rather than an OS resource quota
      if (state.running)
        state.elapsed = Math.min(
          1800,
          state.elapsed + Math.max(0, (this.now() - state.updated) / 1000),
        );
      state.updated = this.now();
      if (state.elapsed >= 1800) state.running = false;
      let output = '';
      if (action === 'reset') {
        if (
          Number(
            this.store.db.prepare('SELECT count(*) AS n FROM lab_history').get()
              ?.n,
          ) >= 100
        )
          throw new DomainError(
            'History limit reached — export and review lab history before starting more runs',
          );
        this.store.db
          .prepare('INSERT INTO lab_history(state) VALUES (?)')
          .run(JSON.stringify(state));
        state = this.fresh();
        state.revision = revision;
        output = 'Clean model started — earlier run retained in history';
      } else if (action === 'start' || action === 'resume') {
        if (state.elapsed >= 1800)
          throw new DomainError('Session limit reached — reset for a new run');
        state.running = true;
        output = 'Model running';
      } else if (action === 'pause') {
        state.running = false;
        output = 'Scenario clock paused';
      } else if (action === 'help') {
        state.assisted = true;
        output =
          'Inspect logs, isolate the hostile destination, disable the test account and stop only the probe process — retain the local portal';
      } else if (action === 'command') {
        if (!state.running)
          throw new DomainError(
            'Start or resume the model before using its tools',
          );

        // Dispatch an exact command allowlist to model mutations; no input reaches a host command runner
        const commands: Record<string, () => string> = {
          help: () =>
            'Model tools: ps, ss, journalctl, accounts, firewall, block 198.51.100.99, deny all, allow portal, disable lab-test, stop probe, status',
          ps: () =>
            state.elapsed >= 30 && !state.processStopped
              ? 'portal pid=10; probe pid=22 account=lab-test'
              : 'portal pid=10',
          ss: () =>
            state.elapsed >= 45 &&
            state.elapsed < 1800 &&
            !state.blocked &&
            !state.processStopped
              ? 'portal localhost:443; probe -> 198.51.100.99:443'
              : 'portal localhost:443; hostile flow contained or not yet observed',
          journalctl: () =>
            [
              state.elapsed >= 15
                ? '15s identity: lab-test used from 192.0.2.99'
                : 'No identity event yet',
              state.elapsed >= 30
                ? '30s endpoint: lab-test starts probe'
                : 'No process event yet',
              state.elapsed >= 45
                ? '45s network: probe attempts outbound flow'
                : 'No network event yet',
            ].join('\n'),
          accounts: () =>
            'portal-service enabled; lab-test ' +
            (state.accountDisabled ? 'disabled' : 'enabled'),
          firewall: () =>
            state.blocked
              ? '198.51.100.99 denied'
              : 'Outbound destination not isolated',
          'block 198.51.100.99': () => {
            state.blocked = true;
            return 'Model firewall now denies the hostile destination';
          },
          'deny all': () => {
            state.blocked = true;
            state.serviceAvailable = false;
            return 'All model traffic denied — required portal is unavailable';
          },
          'allow portal': () => {
            state.serviceAvailable = true;
            return 'Required local portal is reachable again';
          },
          'disable lab-test': () => {
            state.accountDisabled = true;
            return 'Test account disabled — portal-service account retained';
          },
          'stop probe': () => {
            state.processStopped = true;
            return 'Probe stopped — portal process retained';
          },
          status: () => JSON.stringify(this.objectives(state)),
        };
        if (!Object.hasOwn(commands, command))
          throw new DomainError(
            'Unsupported model command — use help; no host shell or external target is available',
          );
        output = commands[command]();
      } else if (action !== 'tick') throw new DomainError('Unknown lab action');
      if (action !== 'tick')
        state.history.push({
          at: Math.floor(state.elapsed),
          action: action === 'command' ? command : action,
          output,
        });
      if (state.history.length > 200)
        throw new DomainError(
          'Run command limit reached — reset to begin another run',
        );
      state.revision++;
      this.store.db
        .prepare(
          'INSERT INTO lab_state VALUES (1,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state',
        )
        .run(JSON.stringify(state));
      this.store.db.exec('COMMIT');
      return state;
    } catch (error) {
      this.store.db.exec('ROLLBACK');
      throw error;
    }
  }

  // Require all containment controls and required service availability together
  objectives(state: LabState) {
    return labObjectives(state);
  }
}
