import { QueryCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { differenceInCalendarDays, isSameDay } from 'date-fns';
import { docClient, TABLE_NAME, isDynamoConfigured } from './dynamodb';
import { Task, EffortLevel, RecurrenceUnit } from '@/types';
import { calculateTaskCompletion } from '@/utils/taskUtils';

export const DEFAULT_PLACES = [
  'Cozinha',
  'Quarto',
  'Banheiro Suíte',
  'Banheiro Social',
  'Lavanderia',
  'Sala',
  'Escritório',
  'Canil',
  'Quintal',
  'Pets',
  'Geral',
];

export interface HouseholdProfile {
  currentStreak: number;
  bestStreak: number;
  streakLastUpdatedAt?: number;
  updatedAt?: number;
  places?: string[];
}

export interface HouseholdData {
  householdId: string;
  profile: HouseholdProfile;
  tasks: Task[];
}

// In-memory fallback cache for development without AWS credentials or tests
const globalDb = globalThis as unknown as {
  __nudge_memory_store__?: Map<string, { profile: HouseholdProfile; tasks: Map<string, Task> }>;
};

const memoryStore =
  globalDb.__nudge_memory_store__ ??
  new Map<string, { profile: HouseholdProfile; tasks: Map<string, Task> }>();

globalDb.__nudge_memory_store__ = memoryStore;

function getMemoryHousehold(householdId: string) {
  if (!memoryStore.has(householdId)) {
    memoryStore.set(householdId, {
      profile: {
        currentStreak: 0,
        bestStreak: 0,
        places: [...DEFAULT_PLACES],
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
      profile: {
        ...mem.profile,
        places:
          mem.profile.places && mem.profile.places.length > 0
            ? mem.profile.places
            : [...DEFAULT_PLACES],
      },
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

    let profile: HouseholdProfile = {
      currentStreak: 0,
      bestStreak: 0,
      places: [...DEFAULT_PLACES],
    };
    const tasks: Task[] = [];

    for (const item of items) {
      if (item.SK === 'PROFILE') {
        profile = {
          currentStreak: item.currentStreak ?? 0,
          bestStreak: item.bestStreak ?? 0,
          streakLastUpdatedAt: item.streakLastUpdatedAt,
          updatedAt: item.updatedAt,
          places:
            item.places && Array.isArray(item.places) && item.places.length > 0
              ? item.places
              : [...DEFAULT_PLACES],
        };
      } else if (typeof item.SK === 'string' && item.SK.startsWith('TASK#')) {
        tasks.push({
          id: item.id,
          title: item.title,
          level: item.level as EffortLevel,
          place: item.place || 'Geral',
          isCompleted: Boolean(item.isCompleted),
          recurrenceInterval: item.recurrenceInterval,
          recurrenceUnit: item.recurrenceUnit as RecurrenceUnit,
          lastCompletedAt: item.lastCompletedAt,
          nextAvailableAt: item.nextAvailableAt,
          createdAt: item.createdAt || Date.now(),
        });
      }
    }

    if (!profile.places || profile.places.length === 0) {
      profile.places = [...DEFAULT_PLACES];
    }

    return { householdId, profile, tasks };
  } catch (error) {
    console.error('[DynamoDB] Error fetching household data:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    const mem = getMemoryHousehold(householdId);
    return {
      householdId,
      profile: {
        ...mem.profile,
        places:
          mem.profile.places && mem.profile.places.length > 0
            ? mem.profile.places
            : [...DEFAULT_PLACES],
      },
      tasks: Array.from(mem.tasks.values()),
    };
  }
}

/**
 * Adds a new task to DynamoDB under the household partition.
 */
export async function createTask(
  householdId: string,
  taskInput: Omit<Task, 'id' | 'createdAt'> & { id?: string; createdAt?: number },
): Promise<Task> {
  const now = Date.now();
  const task: Task = {
    ...taskInput,
    id: taskInput.id || crypto.randomUUID(),
    place: taskInput.place?.trim() || 'Geral',
    createdAt: taskInput.createdAt || now,
  };

  if (!isDynamoConfigured) {
    const mem = getMemoryHousehold(householdId);
    mem.tasks.set(task.id, task);
    if (!mem.profile.places?.some((p) => p.toLowerCase() === task.place.toLowerCase())) {
      mem.profile.places = [...(mem.profile.places || DEFAULT_PLACES), task.place];
    }
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
        place: task.place,
        isCompleted: task.isCompleted ?? false,
        recurrenceInterval: task.recurrenceInterval,
        recurrenceUnit: task.recurrenceUnit,
        lastCompletedAt: task.lastCompletedAt,
        nextAvailableAt: task.nextAvailableAt,
        createdAt: task.createdAt,
        updatedAt: now,
      },
    });

    await docClient.send(command);

    // Auto-register place if new
    await addHouseholdPlace(householdId, task.place);

    return task;
  } catch (error) {
    console.error('[DynamoDB] Error saving task:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
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
    place: updates.place !== undefined ? updates.place.trim() : existing.place || 'Geral',
  };

  const now = Date.now();

  if (!isDynamoConfigured) {
    const mem = getMemoryHousehold(householdId);
    mem.tasks.set(taskId, updated);
    if (!mem.profile.places?.some((p) => p.toLowerCase() === updated.place.toLowerCase())) {
      mem.profile.places = [...(mem.profile.places || DEFAULT_PLACES), updated.place];
    }
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
        place: updated.place,
        isCompleted: updated.isCompleted ?? false,
        recurrenceInterval: updated.recurrenceInterval,
        recurrenceUnit: updated.recurrenceUnit,
        lastCompletedAt: updated.lastCompletedAt,
        nextAvailableAt: updated.nextAvailableAt,
        createdAt: updated.createdAt,
        updatedAt: now,
      },
    });

    await docClient.send(command);

    // Auto-register place if new
    await addHouseholdPlace(householdId, updated.place);

    return updated;
  } catch (error) {
    console.error('[DynamoDB] Error updating task:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
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
    console.error('[DynamoDB] Error deleting task:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
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
    console.error('[DynamoDB] Error deleting household data:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
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
        places: profile.places && profile.places.length > 0 ? profile.places : [...DEFAULT_PLACES],
        updatedAt: now,
      },
    });

    await docClient.send(command);
  } catch (error) {
    console.error('[DynamoDB] Error saving profile:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    const mem = getMemoryHousehold(householdId);
    mem.profile = { ...profile };
  }
}

/**
 * Adds a new place to the household places list.
 */
export async function addHouseholdPlace(householdId: string, placeName: string): Promise<string[]> {
  const trimmed = placeName.trim();
  if (!trimmed) return [];

  const { profile } = await getHouseholdData(householdId);
  const currentPlaces =
    profile.places && profile.places.length > 0 ? [...profile.places] : [...DEFAULT_PLACES];

  if (!currentPlaces.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
    currentPlaces.push(trimmed);
    await saveHouseholdProfile(householdId, { ...profile, places: currentPlaces });
  }

  return currentPlaces;
}

/**
 * Renames an existing place in the household places list and updates all tasks that use it.
 */
export async function renameHouseholdPlace(
  householdId: string,
  oldPlaceName: string,
  newPlaceName: string,
): Promise<void> {
  const oldTrimmed = oldPlaceName.trim();
  const newTrimmed = newPlaceName.trim();
  if (!oldTrimmed || !newTrimmed || oldTrimmed === newTrimmed) return;

  const { profile, tasks } = await getHouseholdData(householdId);
  const currentPlaces =
    profile.places && profile.places.length > 0 ? [...profile.places] : [...DEFAULT_PLACES];

  const updatedPlaces = currentPlaces.map((p) =>
    p.toLowerCase() === oldTrimmed.toLowerCase() ? newTrimmed : p,
  );

  await saveHouseholdProfile(householdId, { ...profile, places: updatedPlaces });

  // Update tasks that were assigned to oldPlaceName
  for (const t of tasks) {
    if (t.place && t.place.toLowerCase() === oldTrimmed.toLowerCase()) {
      await updateTask(householdId, t.id, { place: newTrimmed });
    }
  }
}

/**
 * Deletes a place from the household places list.
 * If reassignTo is provided, reassigns tasks using this place to reassignTo.
 * Otherwise, fails if tasks are assigned to it.
 */
export async function deleteHouseholdPlace(
  householdId: string,
  placeName: string,
  reassignTo?: string,
): Promise<{ success: boolean; error?: string; count?: number }> {
  const trimmed = placeName.trim();
  const { profile, tasks } = await getHouseholdData(householdId);

  // Check if any task is using this place
  const tasksUsingPlace = tasks.filter(
    (t) => t.place && t.place.toLowerCase() === trimmed.toLowerCase(),
  );

  if (tasksUsingPlace.length > 0) {
    if (!reassignTo) {
      return {
        success: false,
        error: 'place_in_use',
        count: tasksUsingPlace.length,
      };
    }
    const targetPlace = reassignTo.trim();
    for (const t of tasksUsingPlace) {
      await updateTask(householdId, t.id, { place: targetPlace });
    }
  }

  const currentPlaces =
    profile.places && profile.places.length > 0 ? [...profile.places] : [...DEFAULT_PLACES];
  const updatedPlaces = currentPlaces.filter((p) => p.toLowerCase() !== trimmed.toLowerCase());

  await saveHouseholdProfile(householdId, { ...profile, places: updatedPlaces });
  return { success: true };
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
