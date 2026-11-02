import { describe, it, expect } from 'vitest';
import {
  TaskFormSchema,
  TaskCreateSchema,
  TaskUpdateSchema,
  AuthLoginSchema,
  AuthRegisterSchema,
  AuthRegisterFormSchema,
  ForgotPasswordSchema,
  ResetPasswordFormSchema,
  PlaceNameSchema,
  RenamePlaceSchema,
  UpdateUserNameSchema,
} from './schemas';
import { EffortLevel } from '@/types';

describe('schemas', () => {
  describe('TaskFormSchema', () => {
    it('validates a valid task form input without recurrence', () => {
      const input = {
        title: 'Clean the kitchen',
        place: 'Cozinha',
        level: EffortLevel.LOW,
        recurrenceUnit: 'none',
        recurrenceInterval: '',
      };
      const result = TaskFormSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('validates a valid task form input with recurrence', () => {
      const input = {
        title: 'Water plants',
        place: 'Sala',
        level: EffortLevel.MEDIUM,
        recurrenceUnit: 'days',
        recurrenceInterval: 3,
      };
      const result = TaskFormSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const input = {
        title: '   ',
        place: 'Cozinha',
        level: EffortLevel.LOW,
        recurrenceUnit: 'none',
      };
      const result = TaskFormSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
      }
    });

    it('rejects empty place', () => {
      const input = {
        title: 'Clean windows',
        place: '   ',
        level: EffortLevel.LOW,
        recurrenceUnit: 'none',
      };
      const result = TaskFormSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('place');
      }
    });

    it('rejects recurrence with missing or invalid interval', () => {
      const input = {
        title: 'Clean bathroom',
        place: 'Banheiro',
        level: EffortLevel.HIGH,
        recurrenceUnit: 'weeks',
        recurrenceInterval: '',
      };
      const result = TaskFormSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('recurrenceInterval');
      }
    });

    it('rejects recurrence with zero or negative interval', () => {
      const input = {
        title: 'Clean bathroom',
        place: 'Banheiro',
        level: EffortLevel.HIGH,
        recurrenceUnit: 'weeks',
        recurrenceInterval: 0,
      };
      const result = TaskFormSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('AuthLoginSchema', () => {
    it('accepts valid credentials and normalizes email', () => {
      const result = AuthLoginSchema.safeParse({
        email: '  USER@EXAMPLE.COM  ',
        password: 'secretpassword',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('rejects invalid email', () => {
      const result = AuthLoginSchema.safeParse({
        email: 'not-an-email',
        password: 'password',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty password', () => {
      const result = AuthLoginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('TaskCreateSchema & TaskUpdateSchema', () => {
    it('validates a task creation payload with defaults', () => {
      const result = TaskCreateSchema.safeParse({
        title: 'New Server Task',
        level: EffortLevel.MEDIUM,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.place).toBe('Geral');
        expect(result.data.isCompleted).toBe(false);
      }
    });

    it('validates a partial update payload', () => {
      const result = TaskUpdateSchema.safeParse({
        title: 'Updated title',
        isCompleted: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('ForgotPasswordSchema', () => {
    it('accepts and normalizes valid recovery email', () => {
      const result = ForgotPasswordSchema.safeParse({
        email: '  RECOVERY@EXAMPLE.COM ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('recovery@example.com');
      }
    });
  });

  describe('AuthRegisterSchema & AuthRegisterFormSchema', () => {
    it('validates server registration payload', () => {
      const result = AuthRegisterSchema.safeParse({
        email: 'alice@example.com',
        password: 'password123',
        name: 'Alice',
      });
      expect(result.success).toBe(true);
    });

    it('accepts matching password and confirmPassword on client form', () => {
      const result = AuthRegisterFormSchema.safeParse({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects mismatched password and confirmPassword', () => {
      const result = AuthRegisterFormSchema.safeParse({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('confirmPassword');
      }
    });

    it('rejects short name or password', () => {
      const result = AuthRegisterFormSchema.safeParse({
        name: 'A',
        email: 'alice@example.com',
        password: '123',
        confirmPassword: '123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ResetPasswordFormSchema', () => {
    it('accepts matching new password and confirmation', () => {
      const result = ResetPasswordFormSchema.safeParse({
        newPassword: 'newsecurepassword',
        confirmNewPassword: 'newsecurepassword',
      });
      expect(result.success).toBe(true);
    });

    it('rejects mismatched new passwords', () => {
      const result = ResetPasswordFormSchema.safeParse({
        newPassword: 'newsecurepassword',
        confirmNewPassword: 'differentpassword',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('confirmNewPassword');
      }
    });
  });

  describe('PlaceNameSchema & RenamePlaceSchema', () => {
    it('validates trimmed place name', () => {
      const result = PlaceNameSchema.safeParse('  Cozinha  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Cozinha');
      }
    });

    it('rejects empty place name', () => {
      const result = PlaceNameSchema.safeParse('   ');
      expect(result.success).toBe(false);
    });

    it('validates rename place payload', () => {
      const result = RenamePlaceSchema.safeParse({
        oldPlace: 'Cozinha',
        newPlace: 'Cozinha Gourmet',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateUserNameSchema', () => {
    it('accepts valid user name', () => {
      const result = UpdateUserNameSchema.safeParse({ newName: 'Carolina' });
      expect(result.success).toBe(true);
    });

    it('rejects name shorter than 2 characters', () => {
      const result = UpdateUserNameSchema.safeParse({ newName: 'C' });
      expect(result.success).toBe(false);
    });
  });
});
