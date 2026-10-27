import { afterEach, describe, expect, it, vi } from 'vitest';
import users from './users.mock.json';
import { createMockUserAdapter } from './mockUser.adapter';
import { createUserFacade } from '../application/user.facade';
import { mockUsersSchema } from './mockUser.schema';

const password = 'test-input-only';
const registration = {
  fullName: 'María Nueva',
  email: 'new@example.test',
  password,
  passwordConfirmation: password,
};

afterEach(() => vi.useRealTimers());

describe('static user mock adapter', () => {
  it('validates exactly 1000 unique fictional users without credentials', async () => {
    expect(mockUsersSchema.parse(users)).toHaveLength(1000);
    expect(new Set(users.map((user) => user.id)).size).toBe(1000);
    expect(new Set(users.map((user) => user.email)).size).toBe(1000);
    expect(
      users.every((user) => user.email.endsWith('@example.test') && !('password' in user))
    ).toBe(true);
    const adapter = createMockUserAdapter(users, { delayMs: 0 });
    const results = await Promise.all(
      users.map((user) => adapter.login({ email: ` ${user.email.toUpperCase()} `, password }))
    );
    for (const [index, user] of users.entries()) {
      const result = results[index];
      if (user.status === 'blocked') {
        expect(result).toEqual({ ok: false, code: 'account-blocked' });
      } else {
        expect(result).toEqual({
          ok: true,
          user: { id: user.id, fullName: user.fullName, email: user.email },
        });
      }
    }
  });

  it('rejects malformed or duplicate fixtures at the boundary', () => {
    expect(() => createMockUserAdapter([{ id: 'invalid' }])).toThrow();
    expect(() => createMockUserAdapter([users[0], users[0]])).toThrow();
    expect(() =>
      createMockUserAdapter([users[0], { ...users[1], email: users[0].email }])
    ).toThrow();
  });

  it('handles unknown users, registration, duplicate email, and isolated adapter instances', async () => {
    const adapter = createMockUserAdapter(users, { delayMs: 0 });
    expect(await adapter.login({ email: 'unknown@example.test', password })).toEqual({
      ok: false,
      code: 'invalid-credentials',
    });
    const result = await adapter.register(registration);
    expect(result.ok).toBe(true);
    expect(await adapter.login({ email: registration.email, password })).toEqual(result);
    expect(
      await adapter.register({ ...registration, email: ` ${registration.email.toUpperCase()} ` })
    ).toEqual({ ok: false, code: 'email-exists' });
    expect(
      await createMockUserAdapter(users, { delayMs: 0 }).login({
        email: registration.email,
        password,
      })
    ).toEqual({ ok: false, code: 'invalid-credentials' });
    if (result.ok) expect(Object.keys(result.user).sort()).toEqual(['email', 'fullName', 'id']);
  });

  it('accepts only one of two concurrent registrations for the same email', async () => {
    const adapter = createMockUserAdapter(users, { delayMs: 0 });
    const results = await Promise.all([
      adapter.register(registration),
      adapter.register(registration),
    ]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toEqual([{ ok: false, code: 'email-exists' }]);
  });

  it('avoids generated ID collisions with existing fixtures', async () => {
    const adapter = createMockUserAdapter([{ ...users[0], id: 'registered-1' }], { delayMs: 0 });
    const result = await adapter.register(registration);
    expect(result.ok && result.user.id).toBe('registered-2');
  });

  it('makes delays and unavailable outcomes deterministic', async () => {
    vi.useFakeTimers();
    const adapter = createMockUserAdapter(users, { delayMs: 500, unavailable: true });
    const login = adapter.login({ email: users[0].email, password });
    const register = adapter.register(registration);
    await vi.advanceTimersByTimeAsync(500);
    expect(await login).toEqual({ ok: false, code: 'unavailable' });
    expect(await register).toEqual({ ok: false, code: 'unavailable' });
  });
});

describe('user access facade', () => {
  it('validates before calling its adapter and maps unexpected exceptions', async () => {
    const adapter = {
      login: vi.fn().mockRejectedValue(new Error('internal')),
      register: vi.fn().mockRejectedValue(new Error('internal')),
    };
    const facade = createUserFacade(adapter);
    expect(await facade.login({ email: '', password: '' })).toEqual({
      ok: false,
      code: 'invalid-input',
    });
    expect(await facade.register({ ...registration, passwordConfirmation: 'wrong' })).toEqual({
      ok: false,
      code: 'invalid-input',
    });
    expect(adapter.login).not.toHaveBeenCalled();
    expect(adapter.register).not.toHaveBeenCalled();
    expect(await facade.login({ email: users[0].email, password })).toEqual({
      ok: false,
      code: 'unavailable',
    });
    expect(await facade.register(registration)).toEqual({ ok: false, code: 'unavailable' });
  });

  it('exposes normalized minimal requests and successful mock results', async () => {
    const adapter = createMockUserAdapter(users, { delayMs: 0 });
    const facade = createUserFacade(adapter);
    expect((await facade.login({ email: ` ${users[0].email.toUpperCase()} `, password })).ok).toBe(
      true
    );
    expect((await facade.register(registration)).ok).toBe(true);
  });
});
