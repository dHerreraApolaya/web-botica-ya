import { NOOP_LOGGER, type TechnicalLogger } from '@/shared/observability/observability.service';
import { USER_LOGS } from '../constants/userLogs.constants';
import type { AccessResult, UserAccessAdapter, UserAccessFacade } from '../domain/User';
import { loginSchema, registrationSchema } from '../utils/accessValidation.util';

const execute = async (
  operation: () => Promise<AccessResult>,
  logger: TechnicalLogger
): Promise<AccessResult> => {
  try {
    return await operation();
  } catch {
    logger.log(USER_LOGS.ADAPTER_FAILED);
    return { ok: false, code: 'unavailable' };
  }
};

export const createUserFacade = (
  adapter: UserAccessAdapter,
  logger: TechnicalLogger = NOOP_LOGGER
): UserAccessFacade => ({
  async login(input) {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) return { ok: false, code: 'invalid-input' };
    return execute(() => adapter.login(parsed.data), logger);
  },
  async register(input) {
    const parsed = registrationSchema.safeParse(input);
    if (!parsed.success) return { ok: false, code: 'invalid-input' };
    const { fullName, email, phone, password } = parsed.data;
    return execute(() => adapter.register({ fullName, email, phone, password }), logger);
  },
});
