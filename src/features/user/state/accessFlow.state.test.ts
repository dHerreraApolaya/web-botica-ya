import { describe, expect, it } from 'vitest';
import { accessFlowReducer, type AccessFlowState } from './accessFlow.state';

describe('access State pattern', () => {
  it('allows submission from idle, success, and error but ignores repeated pending submissions', () => {
    for (const status of ['idle', 'success', 'error'] as const) {
      expect(accessFlowReducer({ status }, { type: 'submit' })).toEqual({ status: 'submitting' });
    }
    const pending: AccessFlowState = { status: 'submitting' };
    expect(accessFlowReducer(pending, { type: 'submit' })).toBe(pending);
    expect(accessFlowReducer(pending, { type: 'succeed' })).toEqual({ status: 'success' });
    expect(accessFlowReducer(pending, { type: 'fail', message: 'Error de prueba' })).toEqual({
      status: 'error',
      message: 'Error de prueba',
    });
  });

  it('ignores stale outcomes and resets every state', () => {
    for (const status of ['idle', 'submitting', 'success', 'error'] as const) {
      const state: AccessFlowState = { status };
      expect(accessFlowReducer(state, { type: 'reset' })).toEqual({ status: 'idle' });
      if (status !== 'submitting') {
        expect(accessFlowReducer(state, { type: 'succeed' })).toBe(state);
        expect(accessFlowReducer(state, { type: 'fail', message: 'stale' })).toBe(state);
      }
    }
  });
});
