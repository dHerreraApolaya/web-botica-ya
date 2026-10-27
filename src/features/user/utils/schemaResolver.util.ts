import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import type { z } from 'zod';

export const createSchemaResolver =
  <T extends FieldValues>(schema: z.ZodType<T>): Resolver<T> =>
  (values) => {
    const parsed = schema.safeParse(values);
    if (parsed.success) return { values: parsed.data, errors: {} };
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if (!errors[field]) errors[field] = { type: issue.code, message: issue.message };
    }
    return { values: {}, errors: errors as FieldErrors<T> };
  };
