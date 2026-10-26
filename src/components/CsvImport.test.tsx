import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CsvImport from './CsvImport';
import Papa from 'papaparse';
import { useStore } from '../store/useStore';
import { EffortLevel } from '../types';
import { IMPORT_CONFIG } from '../constants';

vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
  },
}));

vi.mock('../store/useStore', () => ({
  useStore: vi.fn(),
}));

describe('CsvImport', () => {
  const mockAddTask = vi.fn();
  const mockTasks: any[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as any).mockReturnValue({
      tasks: mockTasks,
      addTask: mockAddTask,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders import button and template link', () => {
    render(<CsvImport />);
    expect(screen.getByText('Import CSV')).toBeInTheDocument();
    expect(screen.getByText('Get CSV Template')).toBeInTheDocument();
  });

  it('handles file selection and adds tasks on success', async () => {
    const user = userEvent.setup();
    render(<CsvImport />);

    const file = new File(['content'], 'tasks.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Import CSV file');

    (Papa.parse as any).mockImplementation((file: any, config: any) => {
      expect(file).toBeDefined();
      expect(config.header).toBe(true);

      config.complete({
        data: [{ title: 'Task 1', effort: 'Low', interval: '1', unit: 'days' }],
        meta: {
          fields: ['title', 'effort', 'interval', 'unit'],
        },
      });
    });

    await user.upload(input, file);

    await waitFor(() => {
      expect(mockAddTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Task 1',
          level: EffortLevel.LOW,
          recurrenceInterval: 1,
          recurrenceUnit: 'days',
        }),
      );
      expect(screen.getByText(/Successfully imported 1 tasks/)).toBeInTheDocument();
    });
  });

  it('shows error for invalid headers', async () => {
    const user = userEvent.setup();
    render(<CsvImport />);

    const file = new File(['content'], 'tasks.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Import CSV file');

    (Papa.parse as any).mockImplementation((file: any, config: any) => {
      config.complete({
        data: [],
        meta: {
          fields: ['wrong', 'headers'],
        },
      });
    });

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Invalid CSV format/)).toBeInTheDocument();
      expect(mockAddTask).not.toHaveBeenCalled();
    });
  });

  it('shows error on CSV parse failure', async () => {
    const user = userEvent.setup();
    render(<CsvImport />);

    const file = new File(['content'], 'tasks.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Import CSV file');

    (Papa.parse as any).mockImplementation((file: any, config: any) => {
      if (config.error) config.error({ message: 'Malformed CSV' });
      else {
        config.complete({
          data: [],
          errors: [{ message: 'Malformed CSV' }],
          meta: {},
        });
      }
    });

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Import failed: Malformed CSV/)).toBeInTheDocument();
      expect(mockAddTask).not.toHaveBeenCalled();
    });
  });

  it('clears status message after timeout', async () => {
    vi.useFakeTimers();
    render(<CsvImport />);

    const file = new File(['content'], 'tasks.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Import CSV file');

    (Papa.parse as any).mockImplementation((file: any, config: any) => {
      config.complete({
        data: [],
        meta: { fields: ['title', 'effort', 'interval', 'unit'] },
      });
    });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/Successfully imported/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(IMPORT_CONFIG.STATUS_MESSAGE_DURATION_MS);
    });

    expect(screen.queryByText(/Successfully imported/)).not.toBeInTheDocument();
  });
});
