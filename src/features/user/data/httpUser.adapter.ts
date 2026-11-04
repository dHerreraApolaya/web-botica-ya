import { z } from 'zod';
import { envConfig } from '@/config/env.config';
import type { AccessResult, UserAccessAdapter } from '../domain/User';

const sessionSchema = z.object({
  accessToken: z.string().min(1),
  user: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
    email: z.string().email(),
    phone: z.string().nullable().optional(),
  }),
});
const errorSchema = z.object({
  code: z.enum([
    'invalid-input',
    'invalid-credentials',
    'account-blocked',
    'email-exists',
    'unavailable',
  ]),
});
const baseUrl = (envConfig.VITE_API_BASE_URL ?? '/v1').replace(/\/$/, '');
let accessToken: string | null = null;

const authenticate = async (path: string, input?: unknown): Promise<AccessResult> => {
  try {
    const response = await fetch(`${baseUrl}/auth/${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...(input ? { body: JSON.stringify(input) } : {}),
    });
    const payload: unknown = await response.json();
    if (!response.ok) {
      const error = errorSchema.safeParse(payload);
      return { ok: false, code: error.success ? error.data.code : 'unavailable' };
    }
    const session = sessionSchema.parse(payload);
    accessToken = session.accessToken;
    return {
      ok: true,
      user: {
        id: session.user.id,
        fullName: session.user.fullName,
        email: session.user.email,
        ...(session.user.phone ? { phone: session.user.phone } : {}),
      },
    };
  } catch {
    return { ok: false, code: 'unavailable' };
  }
};

export const httpUserAdapter: UserAccessAdapter = {
  login: (input) => authenticate('login', input),
  register: (input) => authenticate('register', input),
};

let restoration: Promise<AccessResult> | undefined;
export const restoreIdentitySession = (): Promise<AccessResult> =>
  (restoration ??= authenticate('refresh'));

export const getIdentityAccessToken = (): string | null => accessToken;

export const logoutIdentitySession = async (): Promise<void> => {
  const response = await fetch(`${baseUrl}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('No se pudo cerrar la sesión. Inténtalo nuevamente.');
  accessToken = null;
  restoration = undefined;
};
