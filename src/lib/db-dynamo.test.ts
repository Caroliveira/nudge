import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EffortLevel } from '@/types';

const mockSend = vi.fn();

vi.mock('./dynamodb', () => ({
  TABLE_NAME: 'test_table',
  isDynamoConfigured: true,
  docClient: {
    send: (...args: any[]) => mockSend(...args),
  },
}));

import {
  getHouseholdData,
  createTask,
  updateTask,
  deleteTask,
  deleteHouseholdData,
  saveHouseholdProfile,
} from './db';

describe('db.ts - DynamoDB configured branch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches household data and parses PROFILE and TASK items', async () => {
    mockSend.mockResolvedValueOnce({
      Items: [
        {
          PK: 'HOUSEHOLD#h1',
          SK: 'PROFILE',
          currentStreak: 5,
          bestStreak: 10,
          streakLastUpdatedAt: 1700000000,
        },
        {
          PK: 'HOUSEHOLD#h1',
          SK: 'TASK#t1',
          id: 't1',
          title: 'Clean dishes',
          level: EffortLevel.LOW,
          isCompleted: false,
          recurrenceInterval: 1,
          recurrenceUnit: 'daily',
        },
      ],
    });

    const data = await getHouseholdData('h1');
    expect(data.householdId).toBe('h1');
    expect(data.profile.currentStreak).toBe(5);
    expect(data.profile.bestStreak).toBe(10);
    expect(data.tasks).toHaveLength(1);
    expect(data.tasks[0].title).toBe('Clean dishes');
  });

  it('falls back to memory store on getHouseholdData DynamoDB error', async () => {
    mockSend.mockRejectedValueOnce(new Error('DynamoDB connection failed'));

    const data = await getHouseholdData('h-error');
    expect(data.householdId).toBe('h-error');
    expect(data.tasks).toEqual([]);
  });

  it('creates a task via DynamoDB PutCommand', async () => {
    mockSend.mockResolvedValueOnce({});

    const task = await createTask('h1', {
      title: 'Make bed',
      level: EffortLevel.LOW,
      recurrenceUnit: 'none',
    });

    expect(task.title).toBe('Make bed');
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('falls back to memory store on createTask DynamoDB error', async () => {
    mockSend.mockRejectedValueOnce(new Error('PutCommand failed'));

    const task = await createTask('h-fallback', {
      title: 'Offline task',
      level: EffortLevel.LOW,
      recurrenceUnit: 'none',
    });

    expect(task.title).toBe('Offline task');
  });

  it('returns null when updating a non-existing task', async () => {
    mockSend.mockResolvedValueOnce({ Items: [] });

    const result = await updateTask('h1', 'non-existent', { title: 'New title' });
    expect(result).toBeNull();
  });

  it('updates an existing task via DynamoDB PutCommand', async () => {
    mockSend.mockResolvedValueOnce({
      Items: [
        {
          PK: 'HOUSEHOLD#h1',
          SK: 'TASK#t1',
          id: 't1',
          title: 'Old title',
          level: EffortLevel.LOW,
        },
      ],
    });
    mockSend.mockResolvedValueOnce({});

    const updated = await updateTask('h1', 't1', { title: 'Updated title' });
    expect(updated?.title).toBe('Updated title');
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('falls back to memory store on updateTask DynamoDB error', async () => {
    mockSend.mockResolvedValueOnce({
      Items: [
        {
          PK: 'HOUSEHOLD#h-update-err',
          SK: 'TASK#t-err',
          id: 't-err',
          title: 'Before err',
          level: EffortLevel.LOW,
        },
      ],
    });
    mockSend.mockRejectedValueOnce(new Error('Update failed'));

    const updated = await updateTask('h-update-err', 't-err', { title: 'After err' });
    expect(updated?.title).toBe('After err');
  });

  it('deletes a task via DynamoDB DeleteCommand', async () => {
    mockSend.mockResolvedValueOnce({});

    await expect(deleteTask('h1', 't1')).resolves.not.toThrow();
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('handles error gracefully when deleteTask DynamoDB fails', async () => {
    mockSend.mockRejectedValueOnce(new Error('Delete failed'));

    await expect(deleteTask('h1', 't1')).resolves.not.toThrow();
  });

  it('saves household profile via DynamoDB PutCommand', async () => {
    mockSend.mockResolvedValueOnce({});

    await expect(
      saveHouseholdProfile('h1', { currentStreak: 3, bestStreak: 5 })
    ).resolves.not.toThrow();
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('handles error gracefully when saveHouseholdProfile DynamoDB fails', async () => {
    mockSend.mockRejectedValueOnce(new Error('Profile save failed'));

    await expect(
      saveHouseholdProfile('h1', { currentStreak: 3, bestStreak: 5 })
    ).resolves.not.toThrow();
  });

  it('deletes household data by querying and deleting all items', async () => {
    mockSend.mockResolvedValueOnce({
      Items: [
        { PK: 'HOUSEHOLD#h1', SK: 'PROFILE' },
        { PK: 'HOUSEHOLD#h1', SK: 'TASK#t1' },
      ],
    }); // QueryCommand
    mockSend.mockResolvedValueOnce({}); // DeleteCommand 1
    mockSend.mockResolvedValueOnce({}); // DeleteCommand 2

    await expect(deleteHouseholdData('h1')).resolves.not.toThrow();
    expect(mockSend).toHaveBeenCalledTimes(3);
  });

  it('handles error gracefully when deleteHouseholdData DynamoDB fails', async () => {
    mockSend.mockRejectedValueOnce(new Error('Query failed'));

    await expect(deleteHouseholdData('h1')).resolves.not.toThrow();
  });
});

