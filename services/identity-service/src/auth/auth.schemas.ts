import { z } from 'zod';

const passwordSchema = z.string().min(8).max(128);
const documentTypeSchema = z.enum(['dni', 'foreign_id', 'passport']);

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(300),
    email: z.string().trim().toLowerCase().email().max(254),
    password: passwordSchema,
    phone: z.string().trim().min(7).max(20).optional(),
    documentType: documentTypeSchema.optional(),
    documentNumber: z.string().trim().min(5).max(30).optional(),
  })
  .refine(
    ({ documentType, documentNumber }) => Boolean(documentType) === Boolean(documentNumber),
    'Document type and document number must be provided together.'
  );

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: passwordSchema,
});

export const healthDataConsentSchema = z.object({
  policyVersion: z.string().trim().min(1).max(50),
});

export const assignRoleSchema = z.object({
  roleCode: z.enum(['customer', 'administrator', 'pharmacist']),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
