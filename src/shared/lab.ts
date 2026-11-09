// Share model state and objective descriptions while keeping the server authoritative
export interface LabState {
  revision: number;
  elapsed: number;
  running: boolean;
  updated: number;
  blocked: boolean;
  accountDisabled: boolean;
  processStopped: boolean;
  serviceAvailable: boolean;
  assisted: boolean;
  history: { at: number; action: string; output: string }[];
}

// Require post-event inspection, all containment controls and portal availability within the model limit
export function labObjectives(state: LabState) {
  const investigated = ['ps', 'ss', 'accounts', 'journalctl'].every((command) =>
    state.history.some((entry) => entry.action === command && entry.at >= 45),
  );
  return {
    investigated,
    observed: state.elapsed >= 45,
    networkContained: state.blocked,
    identityContained: state.accountDisabled,
    endpointContained: state.processStopped,
    serviceAvailable: state.serviceAvailable,
    verified:
      investigated &&
      state.elapsed >= 45 &&
      state.elapsed < 1800 &&
      state.blocked &&
      state.accountDisabled &&
      state.processStopped &&
      state.serviceAvailable,
    independent: !state.assisted,
  };
}
