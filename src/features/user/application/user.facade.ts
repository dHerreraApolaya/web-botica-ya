import type { AccessResult, UserAccessAdapter, UserAccessFacade } from '../domain/User';
import { loginSchema, registrationSchema } from '../utils/accessValidation.util';

const execute = async (operation: () => Promise<AccessResult>): Promise<AccessResult> => {
  try {
    return await operation();
  } catch {
    return { ok: false, code: 'unavailable' };
  }
};

export const createUserFacade = (adapter: UserAccessAdapter): UserAccessFacade => ({
  async login(input) {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) return { ok: false, code: 'invalid-input' };
    return execute(() => adapter.login(parsed.data));
  },
  async register(input) {
    const parsed = registrationSchema.safeParse(input);
    if (!parsed.success) return { ok: false, code: 'invalid-input' };
    const { fullName, email, password } = parsed.data;
    return execute(() => adapter.register({ fullName, email, password }));
  },
});
