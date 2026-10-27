import { useEffect, useReducer, useRef } from 'react';
import type { AccessErrorCode, AccessResult, User } from '../domain/User';
import { accessFlowReducer, type AccessFlowState } from '../state/accessFlow.state';

const ERROR_MESSAGES: Record<AccessErrorCode, string> = {
  'invalid-input': 'Revisa los datos del formulario.',
  'invalid-credentials': 'No pudimos iniciar sesión con esos datos de prueba.',
  'account-blocked': 'Esta cuenta de prueba está bloqueada. Usa otra cuenta.',
  'email-exists': 'Este correo ya está registrado. Intenta iniciar sesión.',
  unavailable: 'No pudimos completar la solicitud. Inténtalo nuevamente.',
};

interface AccessFlow {
  state: AccessFlowState;
  submit: (
    operation: () => Promise<AccessResult>,
    onSuccess: (user: User) => void
  ) => Promise<void>;
}

export const useAccessFlow = (): AccessFlow => {
  const [state, dispatch] = useReducer(accessFlowReducer, { status: 'idle' });
  const pending = useRef<boolean>(false);
  const active = useRef<boolean>(true);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  const submit = async (
    operation: () => Promise<AccessResult>,
    onSuccess: (user: User) => void
  ): Promise<void> => {
    if (pending.current) return;
    pending.current = true;
    dispatch({ type: 'submit' });
    try {
      const result = await operation();
      if (!active.current) return;
      if (result.ok) {
        onSuccess(result.user);
        dispatch({ type: 'succeed' });
      } else {
        dispatch({ type: 'fail', message: ERROR_MESSAGES[result.code] });
      }
    } catch {
      if (active.current) dispatch({ type: 'fail', message: ERROR_MESSAGES.unavailable });
    } finally {
      pending.current = false;
    }
  };

  return { state, submit };
};
