import type { FC } from 'react';
import type { AccessFlowState } from '../state/accessFlow.state';

interface AccessFeedbackProps {
  state: AccessFlowState;
}

export const AccessFeedback: FC<AccessFeedbackProps> = ({ state }) => (
  <>
    <div role="status" aria-atomic="true" className="text-sm text-text-muted">
      {state.status === 'submitting' ? 'Procesando tu solicitud…' : ''}
    </div>
    {state.status === 'error' ? (
      <p role="alert" className="rounded-md border border-error bg-surface p-3 text-sm text-error">
        {state.message}
      </p>
    ) : null}
  </>
);
