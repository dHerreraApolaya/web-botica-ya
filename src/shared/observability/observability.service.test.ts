import { describe, expect, it, vi } from 'vitest';
import { createObservability, NOOP_LOGGER, type TechnicalLog } from './observability.service';
import { SALES_LOGS } from '@/features/sales/constants/salesLogs.constants';
import { USER_LOGS } from '@/features/user/constants/userLogs.constants';
import { PRODUCT_LOGS } from '@/features/products/constants/productLogs.constants';

const allowed = { consent: true, doNotTrack: false, globalPrivacyControl: false };

describe('privacy-first observability', () => {
  it.each([SALES_LOGS.ADAPTER_FAILED, USER_LOGS.ADAPTER_FAILED, PRODUCT_LOGS.ADAPTER_FAILED])(
    'sends only registered technical fields for $module',
    (event) => {
      const write = vi.fn();
      const logger = createObservability({ write }, () => allowed);
      logger.log({
        ...event,
        email: 'private@example.test',
        url: '/checkout?token=private',
        error: new Error('secret'),
      } as unknown as TechnicalLog);
      expect(write).toHaveBeenCalledExactlyOnceWith(event);
      expect(Object.keys(write.mock.calls[0][0]).sort()).toEqual(['code', 'level', 'module']);
      expect(Object.isFrozen(write.mock.calls[0][0])).toBe(true);
    }
  );
  it.each([
    { ...allowed, consent: false },
    { ...allowed, doNotTrack: true },
    { ...allowed, globalPrivacyControl: true },
  ])('does not collect when permission denies collection', (policy) => {
    const write = vi.fn();
    createObservability({ write }, () => policy).log(SALES_LOGS.ADAPTER_FAILED);
    expect(write).not.toHaveBeenCalled();
  });
  it('reads permission on every call and never replays denied events', () => {
    const write = vi.fn();
    let consent = false;
    const logger = createObservability({ write }, () => ({ ...allowed, consent }));
    logger.log(SALES_LOGS.ADAPTER_FAILED);
    consent = true;
    logger.log(USER_LOGS.ADAPTER_FAILED);
    consent = false;
    logger.log(PRODUCT_LOGS.ADAPTER_FAILED);
    expect(write).toHaveBeenCalledExactlyOnceWith(USER_LOGS.ADAPTER_FAILED);
  });
  it.each([
    { module: 'sales', code: 'secret-value', level: 'error' },
    { module: 'private-user', code: 'adapter_failed', level: 'error' },
    { module: 'sales', code: 'adapter_failed', level: 'private' },
    null,
  ])('drops unregistered or malformed events', (event) => {
    const write = vi.fn();
    createObservability({ write }, () => allowed).log(event as TechnicalLog);
    expect(write).not.toHaveBeenCalled();
  });
  it('contains synchronous, asynchronous and permission failures without logging their content', async () => {
    const error = new Error('private payload');
    expect(() =>
      createObservability(
        {
          write: () => {
            throw error;
          },
        },
        () => allowed
      ).log(SALES_LOGS.ADAPTER_FAILED)
    ).not.toThrow();
    createObservability({ write: () => Promise.reject(error) }, () => allowed).log(
      SALES_LOGS.ADAPTER_FAILED
    );
    const write = vi.fn();
    createObservability({ write }, () => {
      throw error;
    }).log(SALES_LOGS.ADAPTER_FAILED);
    await Promise.resolve();
    expect(write).not.toHaveBeenCalled();
    expect(NOOP_LOGGER.log(SALES_LOGS.ADAPTER_FAILED)).toBeUndefined();
  });
});
