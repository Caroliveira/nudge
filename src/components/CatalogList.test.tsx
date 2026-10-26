import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CatalogList from './CatalogList';
import { Task, EffortLevel } from '../types';

vi.mock('./TaskCatalogItem', () => ({
  default: ({ task, onToggle, onDelete, onEdit }: any) => (
    <div data-testid="task-item">
      <span>{task.title}</span>
      <button onClick={() => onToggle(task.id)}>Toggle</button>
      <button onClick={() => onDelete(task.id)}>Delete</button>
      <button onClick={onEdit}>Edit</button>
    </div>
  ),
}));

vi.mock('./CatalogEmptyState', () => ({
  default: ({ view }: any) => <div data-testid="empty-state">Empty: {view}</div>,
}));

describe('CatalogList', () => {
  const mockProps = {
    tasks: [],
    view: 'tasks' as const,
    onToggle: vi.fn(),
    onDelete: vi.fn(),
    onEdit: vi.fn(),
  };
  const openFilters = () => {
    fireEvent.click(screen.getByLabelText(/Open filters|catalog\.openFilters/));
  };

  it('renders empty state when no tasks', () => {
    render(<CatalogList {...mockProps} />);
    expect(screen.getByTestId('empty-state')).toHaveTextContent('Empty: tasks');
  });

  it('renders list of tasks', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Task 1',
        level: EffortLevel.LOW,
        isCompleted: false,
        recurrenceUnit: 'none',
      },
      {
        id: '2',
        title: 'Task 2',
        level: EffortLevel.MEDIUM,
        isCompleted: false,
        recurrenceUnit: 'none',
      },
    ];
    render(<CatalogList {...mockProps} tasks={tasks} />);

    expect(screen.getAllByTestId('task-item')).toHaveLength(2);
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  it('passes actions to items', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Task 1',
        level: EffortLevel.LOW,
        isCompleted: false,
        recurrenceUnit: 'none',
      },
    ];
    render(<CatalogList {...mockProps} tasks={tasks} />);

    screen.getByText('Toggle').click();
    expect(mockProps.onToggle).toHaveBeenCalledWith('1');

    screen.getByText('Delete').click();
    expect(mockProps.onDelete).toHaveBeenCalledWith('1');

    screen.getByText('Edit').click();
    expect(mockProps.onEdit).toHaveBeenCalledWith(tasks[0]);
  });

  it('filters tasks by recurrence option', async () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Daily Task',
        level: EffortLevel.LOW,
        isCompleted: false,
        recurrenceUnit: 'days',
      },
      {
        id: '2',
        title: 'Weekly Task',
        level: EffortLevel.MEDIUM,
        isCompleted: false,
        recurrenceUnit: 'weeks',
      },
      {
        id: '3',
        title: 'One-off Task',
        level: EffortLevel.HIGH,
        isCompleted: false,
        recurrenceUnit: 'none',
      },
    ];

    render(<CatalogList {...mockProps} tasks={tasks} />);
    openFilters();

    fireEvent.change(screen.getByLabelText(/Filter recurrence|catalog\.filterRecurrence/), {
      target: { value: 'days' },
    });

    expect(screen.getByText('Daily Task')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Weekly Task')).not.toBeInTheDocument();
      expect(screen.queryByText('One-off Task')).not.toBeInTheDocument();
    });
  });

  it('matches search regardless of accents', async () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Ação diária',
        level: EffortLevel.LOW,
        isCompleted: false,
        recurrenceUnit: 'days',
      },
      {
        id: '2',
        title: 'Revisar backlog',
        level: EffortLevel.MEDIUM,
        isCompleted: false,
        recurrenceUnit: 'weeks',
      },
    ];

    render(<CatalogList {...mockProps} tasks={tasks} />);
    fireEvent.change(screen.getByPlaceholderText(/Search tasks|Buscar tarefas|catalog\.search/), {
      target: { value: 'acao' },
    });

    expect(screen.getByText('Ação diária')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Revisar backlog')).not.toBeInTheDocument();
    });
  });

  it('clears search when clicking the x button', async () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Ação diária',
        level: EffortLevel.LOW,
        isCompleted: false,
        recurrenceUnit: 'days',
      },
      {
        id: '2',
        title: 'Revisar backlog',
        level: EffortLevel.MEDIUM,
        isCompleted: false,
        recurrenceUnit: 'weeks',
      },
    ];

    render(<CatalogList {...mockProps} tasks={tasks} />);
    const searchInput = screen.getByPlaceholderText(/Search tasks|Buscar tarefas|catalog\.search/);
    fireEvent.change(searchInput, { target: { value: 'acao' } });

    await waitFor(() => {
      expect(screen.queryByText('Revisar backlog')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/Clear search|catalog\.clearSearch/));

    expect(searchInput).toHaveValue('');
    await waitFor(() => {
      expect(screen.getByText('Ação diária')).toBeInTheDocument();
      expect(screen.getByText('Revisar backlog')).toBeInTheDocument();
    });
  });

  it('always shows made today option', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Task 1',
        level: EffortLevel.LOW,
        isCompleted: false,
        recurrenceUnit: 'none',
      },
    ];

    render(<CatalogList {...mockProps} tasks={tasks} />);
    openFilters();

    expect(screen.getByLabelText(/Filter status|catalog\.filterStatus/)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Made Today' })).toBeInTheDocument();
  });

  it('filters tasks by available and done options', async () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Open Task',
        level: EffortLevel.LOW,
        isCompleted: false,
        recurrenceUnit: 'days',
      },
      {
        id: '2',
        title: 'Done Task',
        level: EffortLevel.HIGH,
        isCompleted: true,
        recurrenceUnit: 'weeks',
      },
    ];

    render(<CatalogList {...mockProps} tasks={tasks} />);
    openFilters();

    fireEvent.change(screen.getByLabelText(/Filter status|catalog\.filterStatus/), {
      target: { value: 'AVAILABLE' },
    });
    expect(screen.getByText('Open Task')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Done Task')).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Filter status|catalog\.filterStatus/), {
      target: { value: 'DONE' },
    });
    expect(screen.getByText('Done Task')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Open Task')).not.toBeInTheDocument();
    });
  });

  it('applies one filter from each group together', async () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'A Daily Open Low',
        level: EffortLevel.LOW,
        isCompleted: false,
        recurrenceUnit: 'days',
      },
      {
        id: '2',
        title: 'B Weekly Done Low',
        level: EffortLevel.LOW,
        isCompleted: true,
        recurrenceUnit: 'weeks',
      },
      {
        id: '3',
        title: 'C Daily Done High',
        level: EffortLevel.HIGH,
        isCompleted: true,
        recurrenceUnit: 'days',
      },
    ];

    render(<CatalogList {...mockProps} tasks={tasks} />);
    openFilters();

    fireEvent.change(screen.getByLabelText(/Filter status|catalog\.filterStatus/), {
      target: { value: 'DONE' },
    });
    fireEvent.change(screen.getByLabelText(/Filter effort|catalog\.filterEffort/), {
      target: { value: EffortLevel.HIGH },
    });
    fireEvent.change(screen.getByLabelText(/Filter recurrence|catalog\.filterRecurrence/), {
      target: { value: 'days' },
    });

    expect(screen.getByText('C Daily Done High')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('A Daily Open Low')).not.toBeInTheDocument();
      expect(screen.queryByText('B Weekly Done Low')).not.toBeInTheDocument();
    });
  });

  it('shows selected filter count on the filter icon', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Task 1',
        level: EffortLevel.LOW,
        isCompleted: false,
        recurrenceUnit: 'days',
      },
    ];

    render(<CatalogList {...mockProps} tasks={tasks} />);
    expect(screen.queryByTestId('selected-filter-count')).not.toBeInTheDocument();

    openFilters();
    fireEvent.change(screen.getByLabelText(/Filter status|catalog\.filterStatus/), {
      target: { value: 'AVAILABLE' },
    });
    fireEvent.change(screen.getByLabelText(/Filter effort|catalog\.filterEffort/), {
      target: { value: EffortLevel.LOW },
    });

    expect(screen.getByTestId('selected-filter-count')).toHaveTextContent('2');
  });

  it('closes filter popover when clicking outside', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Task 1',
        level: EffortLevel.LOW,
        isCompleted: false,
        recurrenceUnit: 'none',
      },
    ];

    render(<CatalogList {...mockProps} tasks={tasks} />);
    openFilters();

    expect(screen.getByLabelText(/Filter status|catalog\.filterStatus/)).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByLabelText(/Filter status|catalog\.filterStatus/)).not.toBeInTheDocument();
  });

  it('shows and applies clear all filters button', async () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Open Task',
        level: EffortLevel.LOW,
        isCompleted: false,
        recurrenceUnit: 'days',
      },
      {
        id: '2',
        title: 'Done Task',
        level: EffortLevel.HIGH,
        isCompleted: true,
        recurrenceUnit: 'weeks',
      },
    ];

    render(<CatalogList {...mockProps} tasks={tasks} />);
    openFilters();

    expect(
      screen.queryByText(/Clear all filters|catalog\.clearAllFilters/),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Filter status|catalog\.filterStatus/), {
      target: { value: 'DONE' },
    });
    expect(screen.getByText('Done Task')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Open Task')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Clear all filters|catalog\.clearAllFilters/));
    await waitFor(() => {
      expect(screen.getByText('Done Task')).toBeInTheDocument();
      expect(screen.getByText('Open Task')).toBeInTheDocument();
      expect(
        screen.queryByText(/Clear all filters|catalog\.clearAllFilters/),
      ).not.toBeInTheDocument();
    });
  });
});
