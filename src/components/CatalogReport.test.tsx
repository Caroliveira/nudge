import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import CatalogReport from './CatalogReport';
import { useCatalogStats } from '../hooks/useCatalogStats';
import { EffortLevel } from '../types';

vi.mock('../hooks/useCatalogStats');
const storeState = { tasks: [] as any[] };
vi.mock('../store/useStore', () => ({
  useStore: () => ({
    tasks: storeState.tasks,
  }),
}));

describe('CatalogReport', () => {
  it('renders empty state when no tasks', () => {
    storeState.tasks = [];
    (useCatalogStats as any).mockReturnValue({
      hasActivityToday: false,
      effortDist: {},
      recurrenceDist: {},
      totalDone: {},
      totalLeft: {},
      registeredUnits: new Set(),
      currentStreak: 0,
      bestStreak: 0,
    });

    render(<CatalogReport />);

    expect(screen.getByText('No data to report.')).toBeInTheDocument();
  });

  it('renders report components with correct data when tasks exist', () => {
    storeState.tasks = [{ id: '1' } as any];
    const mockStats = {
      hasActivityToday: true,
      effortDist: {
        [EffortLevel.LOW]: 5,
        [EffortLevel.MEDIUM]: 0,
        [EffortLevel.HIGH]: 0,
      },
      recurrenceDist: { days: 2 },
      totalDone: {
        [EffortLevel.LOW]: 10,
        [EffortLevel.MEDIUM]: 0,
        [EffortLevel.HIGH]: 0,
      },
      totalLeft: {
        [EffortLevel.LOW]: 5,
        [EffortLevel.MEDIUM]: 0,
        [EffortLevel.HIGH]: 0,
      },
      registeredUnits: new Set(['days']),
      currentStreak: 3,
      bestStreak: 5,
    };

    (useCatalogStats as any).mockReturnValue(mockStats);

    render(<CatalogReport />);

    expect(screen.getByText("Today's Activity")).toBeInTheDocument();
    const activityHeader = screen.getByText("Today's Activity");
    const activityCard = activityHeader.closest('div')?.parentElement?.parentElement;
    expect(activityCard).not.toBeNull();
    expect(within(activityCard as HTMLElement).getByText('5')).toBeInTheDocument();

    expect(screen.getByText('Streak')).toBeInTheDocument();
    expect(screen.getByText('Current: 3 days')).toBeInTheDocument();
    expect(screen.getByText('Best: 5 days')).toBeInTheDocument();

    expect(screen.getByText('Catalog Health')).toBeInTheDocument();
    expect(screen.getByText('10 done')).toBeInTheDocument();
    expect(screen.getByText('5 left')).toBeInTheDocument();
  });
});
