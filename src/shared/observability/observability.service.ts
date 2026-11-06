import { SALES_LOGS } from '@/features/sales/constants/salesLogs.constants';
import { USER_LOGS } from '@/features/user/constants/userLogs.constants';
import { PRODUCT_LOGS } from '@/features/products/constants/productLogs.constants';

const allowedEvents = [
  ...Object.values(SALES_LOGS),
  ...Object.values(USER_LOGS),
  ...Object.values(PRODUCT_LOGS),
];
export type TechnicalLog = (typeof allowedEvents)[number];

export interface TechnicalLogAdapter {
  write(event: TechnicalLog): void | Promise<void>;
}

export interface ObservationPermission {
  consent: boolean;
  doNotTrack: boolean;
  globalPrivacyControl: boolean;
}

export interface TechnicalLogger {
  log(event: TechnicalLog): void;
}

export const NOOP_LOGGER: TechnicalLogger = Object.freeze({ log: () => undefined });

export const createObservability = (
  adapter: TechnicalLogAdapter,
  permission: () => ObservationPermission
): TechnicalLogger => ({
  log(event) {
    try {
      const policy = permission();
      if (!policy.consent || policy.doNotTrack || policy.globalPrivacyControl) return;
      const definition = allowedEvents.find(
        (candidate) =>
          candidate.module === event.module &&
          candidate.code === event.code &&
          candidate.level === event.level
      );
      if (!definition) return;
      const safeEvent = Object.freeze({
        module: definition.module,
        code: definition.code,
        level: definition.level,
      }) as TechnicalLog;
      void Promise.resolve(adapter.write(safeEvent)).catch(() => undefined);
    } catch {
      return;
    }
  },
});
