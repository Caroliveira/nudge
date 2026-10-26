import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from './TaskForm';
import { EffortLevel } from '../types';

describe('TaskForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly for new task', () => {
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText('Add a personal task')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What needs doing?')).toHaveValue('');
    expect(screen.getByText('Save Task')).toBeInTheDocument();
  });

  it('renders correctly for editing task', () => {
    const initialValues = {
      title: 'Existing Task',
      level: EffortLevel.HIGH,
      recurrenceUnit: 'days' as const,
      recurrenceInterval: 2,
    };

    render(
      <TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} initialValues={initialValues} />,
    );

    expect(screen.getByLabelText('Update Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('High Effort')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Days')).toBeInTheDocument();
    expect(screen.getByText('Update Task')).toBeInTheDocument();
  });

  it('submits form with correct values', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByPlaceholderText('What needs doing?'), 'New Task');
    await user.selectOptions(screen.getByLabelText('Effort Level'), EffortLevel.MEDIUM);

    await user.click(screen.getByText('Save Task'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'New Task',
        level: EffortLevel.MEDIUM,
        recurrenceUnit: 'none',
        recurrenceInterval: undefined,
      });
    });
  });

  it('does not submit if title is empty and shows error state', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const titleInput = screen.getByPlaceholderText('What needs doing?');
    await user.click(screen.getByText('Save Task'));

    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Check for error state
    await waitFor(() => {
      expect(titleInput).toHaveAttribute('aria-invalid', 'true');
      expect(titleInput).toHaveClass('ring-red-700');
    });

    // Error should clear when typing
    await user.type(titleInput, 'A');
    await waitFor(() => {
      expect(titleInput).toHaveAttribute('aria-invalid', 'false');
      expect(titleInput).not.toHaveClass('ring-red-700');
    });
  });

  it('validates recurrence interval when unit is selected', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByPlaceholderText('What needs doing?'), 'Recurring Task');
    await user.selectOptions(screen.getByLabelText('Recurrence'), 'days');

    // Clear interval (it defaults to 1)
    const intervalInput = screen.getByLabelText('Recurrence interval');
    await user.clear(intervalInput);

    await user.click(screen.getByText('Save Task'));

    expect(mockOnSubmit).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(intervalInput).toHaveAttribute('aria-invalid', 'true');
      expect(intervalInput).toHaveClass('ring-red-700');
    });

    // Fix error
    await user.type(intervalInput, '5');
    await waitFor(() => {
      expect(intervalInput).toHaveAttribute('aria-invalid', 'false');
    });

    await user.click(screen.getByText('Save Task'));

    await waitFor(
      () => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            recurrenceUnit: 'days',
            recurrenceInterval: 5,
          }),
        );
      },
      { timeout: 3000 },
    );
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.click(screen.getByText('Cancel'));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows interval input only when recurrence is not none', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.queryByLabelText('Recurrence interval')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Recurrence'), 'days');

    expect(screen.getByLabelText('Recurrence interval')).toBeInTheDocument();
  });
});
