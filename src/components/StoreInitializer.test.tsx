import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { StoreInitializer } from './StoreInitializer';
import { useStore } from '@/store/useStore';
import { EffortLevel, Task } from '@/types';

const sampleTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Clean kitchen',
    level: EffortLevel.MEDIUM,
    isCompleted: false,
    recurrenceUnit: 'none',
  },
];

describe('StoreInitializer', () => {
  beforeEach(() => {
    useStore.setState({
      tasks: [],
      currentStreak: 0,
      bestStreak: 0,
      streakLastUpdatedAt: undefined,
    });
  });

  it('initializes store with tasks and profile on mount', () => {
    render(
      <StoreInitializer
        tasks={sampleTasks}
        profile={{
          currentStreak: 3,
          bestStreak: 7,
          streakLastUpdatedAt: 123456789,
        }}
        userEmail="test@example.com"
        userName="Test User"
      />
    );

    const state = useStore.getState();
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].title).toBe('Clean kitchen');
    expect(state.currentStreak).toBe(3);
    expect(state.bestStreak).toBe(7);
    expect(state.userEmail).toBe('test@example.com');
    expect(state.userName).toBe('Test User');
  });

  it('updates store when props change', () => {
    const { rerender } = render(
      <StoreInitializer
        tasks={sampleTasks}
        profile={{ currentStreak: 1, bestStreak: 1 }}
      />
    );

    expect(useStore.getState().currentStreak).toBe(1);

    const updatedTasks: Task[] = [
      ...sampleTasks,
      {
        id: 'task-2',
        title: 'Walk dog',
        level: EffortLevel.LOW,
        isCompleted: true,
        recurrenceUnit: 'days',
      },
    ];

    rerender(
      <StoreInitializer
        tasks={updatedTasks}
        profile={{ currentStreak: 2, bestStreak: 2 }}
      />
    );

    const state = useStore.getState();
    expect(state.tasks).toHaveLength(2);
    expect(state.currentStreak).toBe(2);
  });
});
