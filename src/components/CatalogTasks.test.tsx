import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CatalogTasks from './CatalogTasks';
import React from 'react';

const mockAddTask = vi.fn();
const mockUpdateTask = vi.fn();
const mockDeleteTask = vi.fn();
const mockToggleTask = vi.fn();
const mockNavigate = vi.fn();

const storeState = {
  tasks: [] as any[],
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'catalog.addPersonalTask') return 'Add a personal task';
      return key;
    },
  }),
  Trans: ({ components }: { components: Record<string, React.ReactElement> }) => (
    <>
      Or {React.cloneElement(components.settings, {}, 'go to settings')} and import a CSV file to
      make your life easier.
    </>
  ),
}));

vi.mock('../store/useStore', () => ({
  useStore: () => ({
    tasks: storeState.tasks,
    addTask: mockAddTask,
    updateTask: mockUpdateTask,
    deleteTask: mockDeleteTask,
  }),
}));

vi.mock('../hooks/useTaskActions', () => ({
  useTaskActions: () => ({
    toggleTask: mockToggleTask,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockNavigate,
  }),
}));

vi.mock('./TaskForm', () => ({
  default: ({ onSubmit, onCancel, initialValues }: any) => (
    <div data-testid="task-form">
      {initialValues ? 'Edit Form' : 'Add Form'}
      <button onClick={() => onSubmit({ title: 'New Task' })}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('./CatalogList', () => ({
  default: ({ onEdit }: any) => (
    <div data-testid="catalog-list">
      CatalogList
      <button onClick={() => onEdit({ id: '1', title: 'Task 1' })}>Edit Task</button>
    </div>
  ),
}));

describe('CatalogTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState.tasks = [];
  });

  it('renders task list view by default', () => {
    render(<CatalogTasks />);

    expect(screen.getByText('Add a personal task')).toBeInTheDocument();
    expect(screen.getByTestId('catalog-list')).toBeInTheDocument();
  });

  it('renders add form after clicking add button', () => {
    render(<CatalogTasks />);
    fireEvent.click(screen.getByText('Add a personal task'));

    expect(screen.getByTestId('task-form')).toHaveTextContent('Add Form');
    expect(screen.queryByTestId('catalog-list')).not.toBeInTheDocument();
  });

  it('renders edit form when edit is triggered from list', () => {
    render(<CatalogTasks />);
    fireEvent.click(screen.getByText('Edit Task'));

    expect(screen.getByTestId('task-form')).toHaveTextContent('Edit Form');
    expect(screen.queryByTestId('catalog-list')).not.toBeInTheDocument();
  });

  it('calls addTask when form is submitted in add mode', () => {
    render(<CatalogTasks />);
    fireEvent.click(screen.getByText('Add a personal task'));
    fireEvent.click(screen.getByText('Submit'));

    expect(mockAddTask).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Task' }));
  });

  it('calls updateTask when form is submitted in edit mode', () => {
    render(<CatalogTasks />);
    fireEvent.click(screen.getByText('Edit Task'));
    fireEvent.click(screen.getByText('Submit'));

    expect(mockUpdateTask).toHaveBeenCalledWith('1', { title: 'New Task' });
  });

  it('navigates to settings when quick-import link is clicked', () => {
    render(<CatalogTasks />);

    fireEvent.click(screen.getByRole('button', { name: /go to settings/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  it('hides quick-import link when tasks exist', () => {
    storeState.tasks = [
      { id: '1', title: 'Task 1', level: 'LOW', isCompleted: false, recurrenceUnit: 'none' },
    ];
    render(<CatalogTasks />);

    expect(screen.queryByRole('button', { name: /go to settings/i })).not.toBeInTheDocument();
  });
});
