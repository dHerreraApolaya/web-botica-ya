import type { AccessResult, User, UserAccessAdapter } from '../domain/User';
import { normalizeEmail } from '../utils/accessValidation.util';
import { mockUsersSchema } from './mockUser.schema';

interface MockUserOptions {
  delayMs?: number;
  unavailable?: boolean;
}

export const createMockUserAdapter = (
  fixture: unknown,
  { delayMs = 350, unavailable = false }: MockUserOptions = {}
): UserAccessAdapter => {
  const users = mockUsersSchema.parse(fixture);
  const usersByEmail = new Map(users.map((user) => [user.email, user]));
  const userIds = new Set(users.map((user) => user.id));
  let nextId = 1;
  const wait = (): Promise<void> =>
    delayMs > 0 ? new Promise((resolve) => setTimeout(resolve, delayMs)) : Promise.resolve();

  return {
    async login({ email }): Promise<AccessResult> {
      await wait();
      if (unavailable) return { ok: false, code: 'unavailable' };
      const user = usersByEmail.get(normalizeEmail(email));
      if (!user) return { ok: false, code: 'invalid-credentials' };
      if (user.status === 'blocked') return { ok: false, code: 'account-blocked' };
      return { ok: true, user: { id: user.id, email: user.email, fullName: user.fullName } };
    },
    async register({ fullName, email }): Promise<AccessResult> {
      await wait();
      if (unavailable) return { ok: false, code: 'unavailable' };
      const normalizedEmail = normalizeEmail(email);
      if (usersByEmail.has(normalizedEmail)) return { ok: false, code: 'email-exists' };
      let id: string;
      do {
        id = `registered-${nextId++}`;
      } while (userIds.has(id));
      userIds.add(id);
      const user: User = { id, fullName, email: normalizedEmail };
      usersByEmail.set(normalizedEmail, { ...user, status: 'active' });
      return { ok: true, user };
    },
  };
};
