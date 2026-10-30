'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getHouseholdId, clearSessionCookie } from '@/lib/session';
import {
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
  refreshRecurringTasks,
  getHouseholdData,
  calculateNewStreak,
  saveHouseholdProfile,
  HouseholdProfile,
} from '@/lib/db';
import { createMagicLinkToken, findUserByEmail } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';
import { Task } from '@/types';

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful no-op outside Next.js request lifecycle
  }
}

export async function recordTaskCompletionAction(
  completedAt = Date.now()
): Promise<HouseholdProfile> {
  const householdId = await getHouseholdId();
  const { profile } = await getHouseholdData(householdId);
  const updatedProfile = calculateNewStreak(profile, completedAt);
  await saveHouseholdProfile(householdId, updatedProfile);

  safeRevalidate('/');
  safeRevalidate('/catalog');
  safeRevalidate('/task');

  return updatedProfile;
}

export async function createTaskAction(taskData: Omit<Task, 'id'>): Promise<Task> {
  const householdId = await getHouseholdId();
  const task = await createTask(householdId, taskData);

  safeRevalidate('/');
  safeRevalidate('/catalog');
  safeRevalidate('/task');

  return task;
}

export async function updateTaskAction(
  taskId: string,
  updates: Partial<Task>
): Promise<Task | null> {
  const householdId = await getHouseholdId();
  const updated = await updateTask(householdId, taskId, updates);

  safeRevalidate('/');
  safeRevalidate('/catalog');
  safeRevalidate('/task');

  return updated;
}

export async function deleteTaskAction(taskId: string): Promise<void> {
  const householdId = await getHouseholdId();
  await deleteTask(householdId, taskId);

  safeRevalidate('/');
  safeRevalidate('/catalog');
  safeRevalidate('/task');
}

export async function toggleTaskAction(taskId: string) {
  const householdId = await getHouseholdId();
  const result = await toggleTaskCompletion(householdId, taskId);

  safeRevalidate('/');
  safeRevalidate('/catalog');
  safeRevalidate('/task');

  return result;
}

export async function refreshRecurringTasksAction(): Promise<Task[]> {
  const householdId = await getHouseholdId();
  const tasks = await refreshRecurringTasks(householdId);

  safeRevalidate('/');
  safeRevalidate('/catalog');
  safeRevalidate('/task');

  return tasks;
}

export interface SendMagicLinkOptions {
  name?: string;
  mode?: 'login' | 'register';
}

export async function sendMagicLinkAction(
  email: string,
  options?: SendMagicLinkOptions
): Promise<{ success: boolean; error?: string }> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalizedEmail = email ? email.trim().toLowerCase() : '';

  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    return { success: false, error: 'invalid_email' };
  }

  const mode = options?.mode || 'login';
  const name = options?.name?.trim();

  if (mode === 'register' && (!name || name.length < 2)) {
    return { success: false, error: 'invalid_name' };
  }

  try {
    const existingUser = await findUserByEmail(normalizedEmail);

    if (mode === 'login' && !existingUser) {
      return { success: false, error: 'account_not_found' };
    }

    if (mode === 'register' && existingUser) {
      return { success: false, error: 'account_already_exists' };
    }

    const token = await createMagicLinkToken(normalizedEmail, name);

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

    const magicLinkUrl = `${baseUrl}/auth/verify?token=${token}`;
    return await sendMagicLinkEmail({
      email: normalizedEmail,
      magicLinkUrl,
      name: name || existingUser?.name,
      isSignUp: mode === 'register',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao processar envio do link';
    console.error('[sendMagicLinkAction Error]', error);
    return { success: false, error: message };
  }
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  safeRevalidate('/');
}
