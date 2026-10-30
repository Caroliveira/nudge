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
} from '@/lib/db';
import { createMagicLinkToken } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';
import { Task } from '@/types';

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful no-op outside Next.js request lifecycle
  }
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

export async function sendMagicLinkAction(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return { success: false, error: 'Por favor, insira um e-mail válido.' };
  }

  try {
    const token = await createMagicLinkToken(email);

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
    return await sendMagicLinkEmail({ email: email.trim(), magicLinkUrl });
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
