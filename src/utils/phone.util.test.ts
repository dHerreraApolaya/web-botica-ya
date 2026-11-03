import { expect, it } from 'vitest';
import { phoneSchema } from './phone.util';

it.each(['999111222', '912345678'])('accepts exactly nine digits: %s', (value) => {
  expect(phoneSchema.parse(value)).toBe(value);
});
it.each([
  '',
  '123124099',
  '012345678',
  '812345678',
  '91234567',
  '9123456789',
  '12345678',
  '1234567890',
  '+51999111222',
  '999 111222',
  '999-11122',
  'abcdefghi',
  '９９９１１１２２２',
])('rejects invalid phone: %s', (value) => {
  expect(phoneSchema.safeParse(value).success).toBe(false);
});
