import { describe, expect, it } from 'vitest';
import { loginSchema, registrationSchema } from './accessValidation.util';

const registration = {
  fullName: ' Ana María ',
  email: ' ANA@example.test ',
  password: 'demo-12345',
  passwordConfirmation: 'demo-12345',
};

describe('access validation', () => {
  it('normalizes names and email without trimming passwords', () => {
    expect(registrationSchema.parse(registration)).toEqual({
      ...registration,
      fullName: 'Ana María',
      email: 'ana@example.test',
    });
    expect(
      loginSchema.parse({ email: ' ANA@example.test ', password: '  12345678  ' }).password
    ).toBe('  12345678  ');
  });

  it.each([
    { email: '', password: '' },
    { email: 'invalid', password: '12345678' },
    { email: 'a@example.test', password: 'short' },
    { email: 'a@example.test', password: 'x'.repeat(129) },
  ])('rejects invalid login fields: %j', (input) => {
    expect(loginSchema.safeParse(input).success).toBe(false);
  });

  it.each([
    { fullName: ' ' },
    { fullName: 'x'.repeat(121) },
    { passwordConfirmation: 'different' },
  ])('rejects invalid registration fields: %j', (change) => {
    expect(registrationSchema.safeParse({ ...registration, ...change }).success).toBe(false);
  });
});
