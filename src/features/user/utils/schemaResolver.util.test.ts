import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createSchemaResolver } from './schemaResolver.util';

const options = { fields: {}, shouldUseNativeValidation: false };

describe('schema form resolver', () => {
  it('returns normalized values and retains the first error per field', async () => {
    const schema = z.object({
      email: z.string().trim().min(5, 'Too short').email('Invalid email'),
    });
    const resolve = createSchemaResolver(schema);
    expect(await resolve({ email: ' ana@example.test ' }, undefined, options)).toEqual({
      values: { email: 'ana@example.test' },
      errors: {},
    });
    expect(await resolve({ email: '' }, undefined, options)).toEqual({
      values: {},
      errors: { email: { type: 'too_small', message: 'Too short' } },
    });
  });
});
