import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TodaysActivity from './CatalogReportActivity';
import { EffortLevel } from '../types';

describe('TodaysActivity', () => {
  const mockStats = {
    hasActivityToday: true,
    effortDist: {
      [EffortLevel.LOW]: 2,
      [EffortLevel.MEDIUM]: 1,
      [EffortLevel.HIGH]: 0,
    },
    recurrenceDist: {
      days: 1,
      weeks: 2,
      months: 0,
      years: 0,
      none: 0,
    },
  };

  it('renders empty state when no activity', () => {
    render(<TodaysActivity stats={{ ...mockStats, hasActivityToday: false }} />);

    expect(screen.getByText('No tasks completed yet today.')).toBeInTheDocument();
  });

  it('renders effort view by default', () => {
    render(<TodaysActivity stats={mockStats} />);

    expect(screen.getByText('Effort').closest('button')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.queryByText('HIGH')).not.toBeInTheDocument();
  });

  it('switches to recurrence view', async () => {
    render(<TodaysActivity stats={mockStats} />);

    fireEvent.click(screen.getByText('Recurrence'));

    expect(screen.getByText('Recurrence').closest('button')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(await screen.findByText('Daily')).toBeInTheDocument();
    expect(await screen.findByText('Weekly')).toBeInTheDocument();
  });
});
