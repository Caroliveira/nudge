'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getHouseholdId, getSession, setSessionCookie, clearSessionCookie } from '@/lib/session';
import {
  createTask,
  updateTask,
  deleteTask,
  deleteHouseholdData,
  toggleTaskCompletion,
  refreshRecurringTasks,
  getHouseholdData,
  calculateNewStreak,
  saveHouseholdProfile,
  HouseholdProfile,
  addHouseholdPlace,
  renameHouseholdPlace,
  deleteHouseholdPlace,
} from '@/lib/db';
import {
  authenticateUser,
  registerUser,
  createPasswordResetToken,
  resetPasswordWithToken,
  findUserByEmail,
  deleteUserAccount,
  updateUserName,
} from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';
import { Task } from '@/types';
import {
  TaskCreateSchema,
  TaskUpdateSchema,
  TaskIdSchema,
  PlaceNameSchema,
  RenamePlaceSchema,
  DeletePlaceSchema,
  AuthLoginSchema,
  AuthRegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  UpdateUserNameSchema,
} from '@/lib/schemas';

function safeRevalidate(path = '/') {
  try {
    revalidatePath(path);
  } catch {
    // Graceful no-op outside Next.js request lifecycle
  }
}

export async function recordTaskCompletionAction(
  completedAt = Date.now(),
): Promise<HouseholdProfile> {
  const validCompletedAt = z.number().int().positive().default(Date.now()).parse(completedAt);
  const householdId = await getHouseholdId();
  const { profile } = await getHouseholdData(householdId);
  const updatedProfile = calculateNewStreak(profile, validCompletedAt);
  await saveHouseholdProfile(householdId, updatedProfile);

  safeRevalidate('/');
  return updatedProfile;
}

export async function createTaskAction(
  taskData: Omit<Task, 'id' | 'createdAt'> & { createdAt?: number },
): Promise<Task> {
  const validated = TaskCreateSchema.parse(taskData);
  const householdId = await getHouseholdId();
  const task = await createTask(householdId, {
    ...validated,
    place: validated.place ?? 'Geral',
  });

  safeRevalidate('/');
  return task;
}

export async function updateTaskAction(
  taskId: string,
  updates: Partial<Task>,
): Promise<Task | null> {
  const validId = TaskIdSchema.parse(taskId);
  const validUpdates = TaskUpdateSchema.parse(updates);
  const householdId = await getHouseholdId();
  const updated = await updateTask(householdId, validId, validUpdates);

  safeRevalidate('/');
  return updated;
}

export async function deleteTaskAction(taskId: string): Promise<void> {
  const validId = TaskIdSchema.parse(taskId);
  const householdId = await getHouseholdId();
  await deleteTask(householdId, validId);

  safeRevalidate('/');
}

export async function toggleTaskAction(taskId: string) {
  const validId = TaskIdSchema.parse(taskId);
  const householdId = await getHouseholdId();
  const result = await toggleTaskCompletion(householdId, validId);

  safeRevalidate('/');
  return result;
}

export async function refreshRecurringTasksAction(): Promise<Task[]> {
  const householdId = await getHouseholdId();
  const { tasks: currentTasks } = await getHouseholdData(householdId);
  const now = Date.now();
  const hasPendingRefreshes = currentTasks.some(
    (t) => t.isCompleted && t.nextAvailableAt && now >= t.nextAvailableAt,
  );

  if (!hasPendingRefreshes) {
    return currentTasks;
  }

  const tasks = await refreshRecurringTasks(householdId);
  safeRevalidate('/');
  return tasks;
}

export async function loginAction(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = AuthLoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      return { success: false, error: 'invalid_credentials' };
    }

    const result = await authenticateUser(parsed.data.email, parsed.data.password);
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'invalid_credentials' };
    }

    await setSessionCookie({
      email: result.user.email,
      name: result.user.name,
      householdId: result.user.householdId,
    });

    safeRevalidate('/');
    return { success: true };
  } catch (error: unknown) {
    console.error('[loginAction Error]', error);
    const message = error instanceof Error ? error.message : 'failed_to_login';
    return { success: false, error: message };
  }
}

export async function registerAction(
  email: string,
  password: string,
  name?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = AuthRegisterSchema.safeParse({ email, password, name });
    if (!parsed.success) {
      return { success: false, error: 'failed_to_register' };
    }

    const result = await registerUser(parsed.data.email, parsed.data.password, parsed.data.name);
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'failed_to_register' };
    }

    await setSessionCookie({
      email: result.user.email,
      name: result.user.name,
      householdId: result.user.householdId,
    });

    safeRevalidate('/');
    return { success: true };
  } catch (error: unknown) {
    console.error('[registerAction Error]', error);
    const message = error instanceof Error ? error.message : 'failed_to_register';
    return { success: false, error: message };
  }
}

export async function forgotPasswordAction(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  const parsed = ForgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false, error: 'invalid_email' };
  }

  const normalizedEmail = parsed.data.email;

  try {
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return { success: false, error: 'account_not_found' };
    }

    const token = await createPasswordResetToken(normalizedEmail);

    let baseUrl = process.env.APP_URL;
    if (!baseUrl) {
      try {
        const headerList = await headers();
        const host = headerList.get('host') || 'localhost:3000';
        const proto =
          headerList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
        baseUrl = `${proto}://${host}`;
      } catch {
        baseUrl = 'http://localhost:3000';
      }
    }

    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    return await sendPasswordResetEmail({
      email: normalizedEmail,
      resetUrl,
      name: user.name,
    });
  } catch (error: unknown) {
    console.error('[forgotPasswordAction Error]', error);
    const message = error instanceof Error ? error.message : 'failed_to_send_reset_email';
    return { success: false, error: message };
  }
}

export async function resetPasswordAction(
  token: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = ResetPasswordSchema.safeParse({ token, newPassword });
    if (!parsed.success) {
      return { success: false, error: 'invalid_token' };
    }

    const result = await resetPasswordWithToken(parsed.data.token, parsed.data.newPassword);
    if (!result.success) {
      return { success: false, error: result.error || 'invalid_token' };
    }
    return { success: true };
  } catch (error: unknown) {
    console.error('[resetPasswordAction Error]', error);
    const message = error instanceof Error ? error.message : 'failed_to_reset_password';
    return { success: false, error: message };
  }
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  safeRevalidate('/');
}

export async function deleteAccountAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (session?.email) {
      const user = await findUserByEmail(session.email);
      if (user?.householdId) {
        await deleteHouseholdData(user.householdId);
      }
      await deleteUserAccount(session.email);
    }
    await clearSessionCookie();
    safeRevalidate('/');
    return { success: true };
  } catch (error: unknown) {
    console.error('[deleteAccountAction Error]', error);
    const message = error instanceof Error ? error.message : 'failed_to_delete_account';
    return { success: false, error: message };
  }
}

export async function updateUserNameAction(
  newName: string,
): Promise<{ success: boolean; name?: string; error?: string }> {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return { success: false, error: 'unauthorized' };
    }

    const parsed = UpdateUserNameSchema.safeParse({ newName });
    if (!parsed.success) {
      return { success: false, error: 'invalid_name' };
    }

    const updatedUser = await updateUserName(session.email, parsed.data.newName);
    if (!updatedUser) {
      return { success: false, error: 'user_not_found' };
    }

    await setSessionCookie({
      email: updatedUser.email,
      name: updatedUser.name,
      householdId: updatedUser.householdId,
    });

    safeRevalidate('/');
    return { success: true, name: updatedUser.name };
  } catch (error: unknown) {
    console.error('[updateUserNameAction Error]', error);
    const message = error instanceof Error ? error.message : 'failed_to_update_name';
    return { success: false, error: message };
  }
}

export async function addPlaceAction(place: string): Promise<string[]> {
  const validPlace = PlaceNameSchema.parse(place);
  const householdId = await getHouseholdId();
  const places = await addHouseholdPlace(householdId, validPlace);

  safeRevalidate('/');
  return places;
}

export async function renamePlaceAction(
  oldPlace: string,
  newPlace: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = RenamePlaceSchema.safeParse({ oldPlace, newPlace });
    if (!parsed.success) {
      return { success: false, error: 'invalid_place' };
    }

    const householdId = await getHouseholdId();
    await renameHouseholdPlace(householdId, parsed.data.oldPlace, parsed.data.newPlace);

    safeRevalidate('/');
    return { success: true };
  } catch (error: unknown) {
    console.error('[renamePlaceAction Error]', error);
    const message = error instanceof Error ? error.message : 'failed_to_rename_place';
    return { success: false, error: message };
  }
}

export async function deletePlaceAction(
  place: string,
  reassignTo?: string,
): Promise<{ success: boolean; error?: string; count?: number }> {
  try {
    const parsed = DeletePlaceSchema.safeParse({ place, reassignTo });
    if (!parsed.success) {
      return { success: false, error: 'invalid_place' };
    }

    const householdId = await getHouseholdId();
    const result = await deleteHouseholdPlace(
      householdId,
      parsed.data.place,
      parsed.data.reassignTo,
    );

    safeRevalidate('/');
    return result;
  } catch (error: unknown) {
    console.error('[deletePlaceAction Error]', error);
    const message = error instanceof Error ? error.message : 'failed_to_delete_place';
    return { success: false, error: message };
  }
}
