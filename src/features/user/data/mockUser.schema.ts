import { z } from 'zod';

const mockUserSchema = z
  .object({
    id: z.string().min(1),
    fullName: z.string().min(2).max(120),
    email: z.email().refine((value) => value.endsWith('@example.test')),
    status: z.enum(['active', 'blocked']),
  })
  .strict();

export const mockUsersSchema = z.array(mockUserSchema).superRefine((users, context) => {
  const ids = new Set<string>();
  const emails = new Set<string>();
  for (const user of users) {
    if (ids.has(user.id) || emails.has(user.email)) {
      context.addIssue({ code: 'custom', message: 'Mock users must have unique IDs and emails.' });
    }
    ids.add(user.id);
    emails.add(user.email);
  }
});
