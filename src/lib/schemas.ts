import { z } from 'zod';
import { EffortLevel } from '@/types';

export const EffortLevelSchema = z.nativeEnum(EffortLevel);

export const RecurrenceUnitSchema = z.enum(['days', 'weeks', 'months', 'years', 'none']);

export const TaskCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(120, 'Title cannot exceed 120 characters'),
  level: EffortLevelSchema,
  place: z.string().trim().max(50, 'Place cannot exceed 50 characters').default('Geral').optional(),
  isCompleted: z.boolean().optional().default(false),
  recurrenceInterval: z.number().int().min(1).optional(),
  recurrenceUnit: RecurrenceUnitSchema.optional().default('none'),
  lastCompletedAt: z.number().int().positive().optional(),
  nextAvailableAt: z.number().int().positive().optional(),
  createdAt: z.number().int().positive().optional(),
});

export const TaskUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(120, 'Title cannot exceed 120 characters')
    .optional(),
  level: EffortLevelSchema.optional(),
  place: z.string().trim().max(50, 'Place cannot exceed 50 characters').optional(),
  isCompleted: z.boolean().optional(),
  recurrenceInterval: z.number().int().min(1).optional(),
  recurrenceUnit: RecurrenceUnitSchema.optional(),
  lastCompletedAt: z.number().int().positive().optional(),
  nextAvailableAt: z.number().int().positive().optional(),
  createdAt: z.number().int().positive().optional(),
});

export const TaskIdSchema = z.string().trim().min(1, 'Task ID is required');

export const PlaceNameSchema = z
  .string()
  .trim()
  .min(1, 'Place name cannot be empty')
  .max(50, 'Place name cannot exceed 50 characters');

export const RenamePlaceSchema = z.object({
  oldPlace: PlaceNameSchema,
  newPlace: PlaceNameSchema,
});

export const DeletePlaceSchema = z.object({
  place: PlaceNameSchema,
  reassignTo: z.string().trim().max(50).optional(),
});

export const AuthLoginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const AuthRegisterSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must have at least 6 characters'),
  name: z.string().trim().min(2, 'Name must have at least 2 characters').max(60).optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must have at least 6 characters'),
});

export const UpdateUserNameSchema = z.object({
  newName: z
    .string()
    .trim()
    .min(2, 'Name must have at least 2 characters')
    .max(60, 'Name cannot exceed 60 characters'),
});

export const TaskFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title cannot be empty')
      .max(120, 'Title cannot exceed 120 characters'),
    level: EffortLevelSchema,
    place: z
      .string()
      .trim()
      .min(1, 'Place cannot be empty')
      .max(50, 'Place cannot exceed 50 characters'),
    recurrenceInterval: z.union([z.number().int().min(1), z.literal('')]).optional(),
    recurrenceUnit: RecurrenceUnitSchema.default('none'),
  })
  .refine(
    (data) => {
      if (data.recurrenceUnit !== 'none') {
        return typeof data.recurrenceInterval === 'number' && data.recurrenceInterval >= 1;
      }
      return true;
    },
    {
      message: 'Recurrence interval must be at least 1',
      path: ['recurrenceInterval'],
    },
  );

export const AuthRegisterFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must have at least 2 characters')
      .max(60, 'Name cannot exceed 60 characters'),
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    password: z.string().min(6, 'Password must have at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const ResetPasswordFormSchema = z
  .object({
    newPassword: z.string().min(6, 'Password must have at least 6 characters'),
    confirmNewPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

export type TaskCreateInput = z.infer<typeof TaskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof TaskUpdateSchema>;
export type TaskFormInput = z.infer<typeof TaskFormSchema>;
export type AuthLoginInput = z.infer<typeof AuthLoginSchema>;
export type AuthRegisterInput = z.infer<typeof AuthRegisterSchema>;
export type AuthRegisterFormInput = z.infer<typeof AuthRegisterFormSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ResetPasswordFormInput = z.infer<typeof ResetPasswordFormSchema>;
export type UpdateUserNameInput = z.infer<typeof UpdateUserNameSchema>;
