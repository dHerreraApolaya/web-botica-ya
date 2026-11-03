import { describe, expect, it } from 'vitest';
import { loginSchema, registrationSchema } from './accessValidation.util';

const registration = {
  phone: '999111222',
  fullName: ' Ana María ',
  email: ' ANA@example.test ',
  password: 'demo-12345',
  passwordConfirmation: 'demo-12345',
};

describe('access validation', () => {
  it('accepts names up to 300 characters', () => {
    expect(
      registrationSchema.safeParse({ ...registration, fullName: 'x'.repeat(300) }).success
    ).toBe(true);
  });
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
    { email: 'usuario@', password: '12345678' },
    { email: 'usuario@dominio', password: '12345678' },
    { email: 'usuario dominio@test.com', password: '12345678' },
    { email: 'a@example.test', password: 'short' },
    { email: 'a@example.test', password: 'x'.repeat(129) },
  ])('rejects invalid login fields: %j', (input) => {
    expect(loginSchema.safeParse(input).success).toBe(false);
  });

  it.each([
    { phone: '' },
    { phone: 'abcdefghi' },
    { phone: '123' },
    { fullName: ' ' },
    { fullName: 'x'.repeat(301) },
    { passwordConfirmation: 'different' },
  ])('rejects invalid registration fields: %j', (change) => {
    expect(registrationSchema.safeParse({ ...registration, ...change }).success).toBe(false);
  });
});
