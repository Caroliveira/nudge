import { QueryCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { differenceInCalendarDays, isSameDay } from 'date-fns';
import { docClient, TABLE_NAME, isDynamoConfigured } from './dynamodb';
import { Task, EffortLevel, RecurrenceUnit } from '@/types';
import { calculateTaskCompletion } from '@/utils/taskUtils';

export interface HouseholdProfile {
  currentStreak: number;
  bestStreak: number;
  streakLastUpdatedAt?: number;
  updatedAt?: number;
}

export interface HouseholdData {
  householdId: string;
  profile: HouseholdProfile;
  tasks: Task[];
}

// In-memory fallback cache for development without AWS credentials or tests
const memoryStore = new Map<string, { profile: HouseholdProfile; tasks: Map<string, Task> }>();

function getMemoryHousehold(householdId: string) {
  if (!memoryStore.has(householdId)) {
    memoryStore.set(householdId, {
      profile: {
        currentStreak: 0,
        bestStreak: 0,
      },
      tasks: new Map(),
    });
  }
  return memoryStore.get(householdId)!;
}

/**
 * Retrieves all data for a household (profile + tasks) in a single query.
 */
export async function getHouseholdData(householdId: string): Promise<HouseholdData> {
  if (!isDynamoConfigured) {
    const mem = getMemoryHousehold(householdId);
    return {
      householdId,
      profile: { ...mem.profile },
      tasks: Array.from(mem.tasks.values()),
    };
  }

  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `HOUSEHOLD#${householdId}`,
      },
    });

    const response = await docClient.send(command);
    const items = response.Items || [];

    let profile: HouseholdProfile = { currentStreak: 0, bestStreak: 0 };
    const tasks: Task[] = [];

    for (const item of items) {
      if (item.SK === 'PROFILE') {
        profile = {
          currentStreak: item.currentStreak ?? 0,
          bestStreak: item.bestStreak ?? 0,
          streakLastUpdatedAt: item.streakLastUpdatedAt,
          updatedAt: item.updatedAt,
        };
      } else if (typeof item.SK === 'string' && item.SK.startsWith('TASK#')) {
        tasks.push({
          id: item.id,
          title: item.title,
          level: item.level as EffortLevel,
          isCompleted: Boolean(item.isCompleted),
          recurrenceInterval: item.recurrenceInterval,
          recurrenceUnit: item.recurrenceUnit as RecurrenceUnit,
          lastCompletedAt: item.lastCompletedAt,
          nextAvailableAt: item.nextAvailableAt,
        });
      }
    }

    return { householdId, profile, tasks };
  } catch (error) {
    console.warn('[DynamoDB] Fallback to in-memory store:', error);
    const mem = getMemoryHousehold(householdId);
    return {
      householdId,
      profile: { ...mem.profile },
      tasks: Array.from(mem.tasks.values()),
    };
  }
}

/**
 * Adds a new task to DynamoDB under the household partition.
 */
export async function createTask(
  householdId: string,
  taskInput: Omit<Task, 'id'> & { id?: string },
): Promise<Task> {
  const task: Task = {
    ...taskInput,
    id: taskInput.id || crypto.randomUUID(),
  };

  const now = Date.now();

  if (!isDynamoConfigured) {
    const mem = getMemoryHousehold(householdId);
    mem.tasks.set(task.id, task);
    return task;
  }

  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `HOUSEHOLD#${householdId}`,
        SK: `TASK#${task.id}`,
        type: 'TASK',
        id: task.id,
        title: task.title,
        level: task.level,
        isCompleted: task.isCompleted ?? false,
        recurrenceInterval: task.recurrenceInterval,
        recurrenceUnit: task.recurrenceUnit,
        lastCompletedAt: task.lastCompletedAt,
        nextAvailableAt: task.nextAvailableAt,
        createdAt: now,
        updatedAt: now,
      },
    });

    await docClient.send(command);
    return task;
  } catch (error) {
    console.warn('[DynamoDB] Error saving task, fallback to in-memory:', error);
    const mem = getMemoryHousehold(householdId);
    mem.tasks.set(task.id, task);
    return task;
  }
}

/**
 * Updates an existing task in DynamoDB.
 */
export async function updateTask(
  householdId: string,
  taskId: string,
  updates: Partial<Task>,
): Promise<Task | null> {
  const householdData = await getHouseholdData(householdId);
  const existing = householdData.tasks.find((t) => t.id === taskId);
  if (!existing) {
    return null;
  }

  const updated: Task = {
    ...existing,
    ...updates,
    id: taskId,
  };

  const now = Date.now();

  if (!isDynamoConfigured) {
    const mem = getMemoryHousehold(householdId);
    mem.tasks.set(taskId, updated);
    return updated;
  }

  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `HOUSEHOLD#${householdId}`,
        SK: `TASK#${taskId}`,
        type: 'TASK',
        id: taskId,
        title: updated.title,
        level: updated.level,
        isCompleted: updated.isCompleted ?? false,
        recurrenceInterval: updated.recurrenceInterval,
        recurrenceUnit: updated.recurrenceUnit,
        lastCompletedAt: updated.lastCompletedAt,
        nextAvailableAt: updated.nextAvailableAt,
        updatedAt: now,
      },
    });

    await docClient.send(command);
    return updated;
  } catch (error) {
    console.warn('[DynamoDB] Error updating task, fallback to in-memory:', error);
    const mem = getMemoryHousehold(householdId);
    mem.tasks.set(taskId, updated);
    return updated;
  }
}

/**
 * Deletes a task from DynamoDB.
 */
export async function deleteTask(householdId: string, taskId: string): Promise<void> {
  if (!isDynamoConfigured) {
    const mem = getMemoryHousehold(householdId);
    mem.tasks.delete(taskId);
    return;
  }

  try {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `HOUSEHOLD#${householdId}`,
        SK: `TASK#${taskId}`,
      },
    });

    await docClient.send(command);
  } catch (error) {
    console.warn('[DynamoDB] Error deleting task, fallback to in-memory:', error);
    const mem = getMemoryHousehold(householdId);
    mem.tasks.delete(taskId);
  }
}

/**
 * Deletes all data for a household (profile + tasks) from DynamoDB and in-memory store.
 */
export async function deleteHouseholdData(householdId: string): Promise<void> {
  memoryStore.delete(householdId);

  if (!isDynamoConfigured) {
    return;
  }

  try {
    const queryCommand = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `HOUSEHOLD#${householdId}`,
      },
    });

    const response = await docClient.send(queryCommand);
    const items = response.Items || [];

    for (const item of items) {
      if (item.PK && item.SK) {
        await docClient.send(
          new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
              PK: item.PK,
              SK: item.SK,
            },
          }),
        );
      }
    }
  } catch (error) {
    console.warn('[DynamoDB] Error deleting household data, fallback to in-memory:', error);
  }
}

/**
 * Marks a task as completed or incomplete and updates streaks.
 */
export async function toggleTaskCompletion(
  householdId: string,
  taskId: string,
): Promise<{ task: Task; profile: HouseholdProfile } | null> {
  const { profile, tasks } = await getHouseholdData(householdId);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) {
    return null;
  }

  const newCompleted = !task.isCompleted;
  const updatedTask = calculateTaskCompletion(task, newCompleted);
  await updateTask(householdId, taskId, updatedTask);

  let updatedProfile = { ...profile };

  if (newCompleted && updatedTask.lastCompletedAt) {
    updatedProfile = calculateNewStreak(profile, updatedTask.lastCompletedAt);
    await saveHouseholdProfile(householdId, updatedProfile);
  }

  return { task: updatedTask, profile: updatedProfile };
}

/**
 * Recalculates streak following the Nudge streak rules.
 */
export function calculateNewStreak(
  currentProfile: HouseholdProfile,
  completedAt = Date.now(),
): HouseholdProfile {
  const previousUpdate = currentProfile.streakLastUpdatedAt;

  if (previousUpdate && isSameDay(previousUpdate, completedAt)) {
    return {
      ...currentProfile,
      bestStreak: Math.max(currentProfile.bestStreak, currentProfile.currentStreak),
    };
  }

  const currentStreak =
    previousUpdate && differenceInCalendarDays(completedAt, previousUpdate) === 1
      ? currentProfile.currentStreak + 1
      : 1;

  return {
    currentStreak,
    bestStreak: Math.max(currentProfile.bestStreak, currentStreak),
    streakLastUpdatedAt: completedAt,
  };
}

/**
 * Saves household profile (streak and stats) to DynamoDB.
 */
export async function saveHouseholdProfile(
  householdId: string,
  profile: HouseholdProfile,
): Promise<void> {
  const now = Date.now();

  if (!isDynamoConfigured) {
    const mem = getMemoryHousehold(householdId);
    mem.profile = { ...profile };
    return;
  }

  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `HOUSEHOLD#${householdId}`,
        SK: 'PROFILE',
        type: 'PROFILE',
        currentStreak: profile.currentStreak,
        bestStreak: profile.bestStreak,
        streakLastUpdatedAt: profile.streakLastUpdatedAt,
        updatedAt: now,
      },
    });

    await docClient.send(command);
  } catch (error) {
    console.warn('[DynamoDB] Error saving profile, fallback to in-memory:', error);
    const mem = getMemoryHousehold(householdId);
    mem.profile = { ...profile };
  }
}

/**
 * Refreshes recurring tasks whose nextAvailableAt timestamp has elapsed.
 */
export async function refreshRecurringTasks(householdId: string): Promise<Task[]> {
  const { tasks } = await getHouseholdData(householdId);
  const now = Date.now();
  const updatedList: Task[] = [];

  for (const t of tasks) {
    if (t.isCompleted && t.nextAvailableAt && now >= t.nextAvailableAt) {
      const refreshed: Task = { ...t, isCompleted: false, nextAvailableAt: undefined };
      await updateTask(householdId, t.id, refreshed);
      updatedList.push(refreshed);
    } else {
      updatedList.push(t);
    }
  }

  return updatedList;
}
