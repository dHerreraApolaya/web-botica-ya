import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAccessFlow } from './useAccessFlow.hook';
import type { AccessErrorCode, AccessResult } from '../domain/User';

afterEach(cleanup);

describe('access flow lifecycle', () => {
  it.each([
    'invalid-input',
    'invalid-credentials',
    'account-blocked',
    'email-exists',
    'unavailable',
  ] satisfies AccessErrorCode[])('maps %s to user-facing feedback', async (code) => {
    const { result } = renderHook(useAccessFlow);
    await act(async () => {
      await result.current.submit(async () => ({ ok: false, code }), vi.fn());
    });
    expect(result.current.state.status).toBe('error');
    expect(result.current.state.message).toBeTruthy();
  });

  it('recovers from an unexpected adapter exception', async () => {
    const { result } = renderHook(useAccessFlow);
    await act(async () => {
      await result.current.submit(async () => {
        throw new Error('private detail');
      }, vi.fn());
    });
    expect(result.current.state).toEqual({
      status: 'error',
      message: 'No pudimos completar la solicitud. Inténtalo nuevamente.',
    });
  });

  it('does not create a session after the form has unmounted', async () => {
    let complete: (value: AccessResult) => void = () => undefined;
    const pending = new Promise<AccessResult>((resolve) => {
      complete = resolve;
    });
    const onSuccess = vi.fn();
    const { result, unmount } = renderHook(useAccessFlow);
    let request: Promise<void>;
    act(() => {
      request = result.current.submit(() => pending, onSuccess);
    });
    unmount();
    await act(async () => {
      complete({
        ok: true,
        user: { id: 'test', fullName: 'Ana María', email: 'ana@example.test' },
      });
      await request;
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('ignores a rejected request after unmounting', async () => {
    let reject: (reason: Error) => void = () => undefined;
    const pending = new Promise<AccessResult>((_resolve, fail) => {
      reject = fail;
    });
    const { result, unmount } = renderHook(useAccessFlow);
    let request: Promise<void>;
    act(() => {
      request = result.current.submit(() => pending, vi.fn());
    });
    unmount();
    await act(async () => {
      reject(new Error('late'));
      await request;
    });
  });
});
