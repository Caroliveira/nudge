import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import CsvExport from './CsvExport';
import { useStore } from '../store/useStore';
import { EffortLevel } from '../types';

vi.mock('../store/useStore');

describe('CsvExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('shows error if trying to export when tasks are empty', async () => {
    const user = userEvent.setup();
    (useStore as any).mockImplementation((selector?: any) => {
      const state = { tasks: [] };
      return selector ? selector(state) : state;
    });

    render(<CsvExport />);
    await user.click(screen.getByRole('button', { name: /export/i }));

    expect(screen.getByText(/Export failed/i)).toBeInTheDocument();
  });

  it('exports CSV successfully when tasks exist', async () => {
    const user = userEvent.setup();
    const mockTasks = [
      {
        id: '1',
        title: 'Task 1',
        level: EffortLevel.LOW,
        place: 'Kitchen',
        recurrenceInterval: 1,
        recurrenceUnit: 'days',
        isCompleted: false,
        createdAt: 123456,
      },
    ];

    (useStore as any).mockImplementation((selector?: any) => {
      const state = { tasks: mockTasks };
      return selector ? selector(state) : state;
    });

    render(<CsvExport />);
    await user.click(screen.getByRole('button', { name: /export/i }));

    expect(screen.getByText(/Exported 1 tasks/i)).toBeInTheDocument();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('handles unexpected error in export gracefully', async () => {
    const user = userEvent.setup();
    (useStore as any).mockImplementation((selector?: any) => {
      const state = { tasks: [{ id: '1' }] };
      return selector ? selector(state) : state;
    });

    (global.URL.createObjectURL as any).mockImplementationOnce(() => {
      throw new Error('Blob error');
    });

    render(<CsvExport />);
    await user.click(screen.getByRole('button', { name: /export/i }));

    expect(screen.getByText(/Export failed/i)).toBeInTheDocument();
  });
});
