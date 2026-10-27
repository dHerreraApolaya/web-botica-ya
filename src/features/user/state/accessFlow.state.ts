export type AccessStatus = 'idle' | 'submitting' | 'success' | 'error';
export interface AccessFlowState {
  readonly status: AccessStatus;
  readonly message?: string;
}
export type AccessFlowEvent =
  { type: 'submit' | 'succeed' | 'reset' } | { type: 'fail'; message: string };

interface AccessStateBehavior {
  handle: (state: AccessFlowState, event: AccessFlowEvent) => AccessFlowState;
}

const readyState: AccessStateBehavior = {
  handle: (state, event) => (event.type === 'submit' ? { status: 'submitting' } : state),
};
const submittingState: AccessStateBehavior = {
  handle: (state, event) => {
    if (event.type === 'succeed') return { status: 'success' };
    if (event.type === 'fail') return { status: 'error', message: event.message };
    return state;
  },
};
const STATES: Record<AccessStatus, AccessStateBehavior> = {
  idle: readyState,
  submitting: submittingState,
  success: readyState,
  error: readyState,
};

export const accessFlowReducer = (
  state: AccessFlowState,
  event: AccessFlowEvent
): AccessFlowState =>
  event.type === 'reset' ? { status: 'idle' } : STATES[state.status].handle(state, event);
