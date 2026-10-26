import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskCatalogItem from './TaskCatalogItem';
import { EffortLevel, Task } from '../types';
import { motion, HTMLMotionProps, PanInfo } from 'framer-motion';
import { SWIPE_CONFIG } from '../constants';

vi.mock('framer-motion', () => ({
  motion: {
    div: vi.fn(
      ({
        children,
        onKeyDown,
        drag: _drag,
        dragConstraints: _dragConstraints,
        dragElastic: _dragElastic,
        dragSnapToOrigin: _dragSnapToOrigin,
        onDragEnd: _onDragEnd,
        onDrag: _onDrag,
        onDragStart: _onDragStart,
        onAnimationStart: _onAnimationStart,
        style: _style,
        ...props
      }: HTMLMotionProps<'div'>) => (
        <div data-testid="motion-div" onKeyDown={onKeyDown} {...props}>
          {children as React.ReactNode}
        </div>
      ),
    ),
    button: vi.fn(({ children, ...props }) => <button {...props}>{children}</button>),
  },
  useMotionValue: vi.fn(() => ({
    get: () => 0,
    set: vi.fn(),
    on: vi.fn(),
    onChange: vi.fn(),
    attach: vi.fn(),
  })),
  useTransform: vi.fn(() => ({
    get: () => 0,
    on: vi.fn(),
    onChange: vi.fn(),
    attach: vi.fn(),
  })),
  useMotionValueEvent: vi.fn(),
  animate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./TaskCatalogActions', () => ({
  SwipeAction: () => <div data-testid="swipe-action">SwipeAction</div>,
}));

describe('TaskCatalogItem', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    level: EffortLevel.LOW,
    isCompleted: false,
    recurrenceUnit: 'none',
  };

  const mockOnToggle = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const simulateSwipe = async (offsetX: number) => {
    const mockMotionDiv = vi.mocked(motion.div);
    const props = mockMotionDiv.mock.lastCall?.[0] as HTMLMotionProps<'div'>;
    const onDragEnd = props.onDragEnd;

    if (!onDragEnd) throw new Error('onDragEnd not defined on motion.div');

    await act(async () => {
      await onDragEnd({} as any, { offset: { x: offsetX, y: 0 } } as PanInfo);
    });
  };

  it('renders task details correctly', () => {
    render(
      <TaskCatalogItem
        task={mockTask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />,
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Low Effort')).toBeInTheDocument();
    expect(screen.getByLabelText('Mark as complete')).toBeInTheDocument();
  });

  it('calls onToggle when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(<TaskCatalogItem task={mockTask} onToggle={mockOnToggle} onDelete={mockOnDelete} />);

    await user.click(screen.getByLabelText('Mark as complete'));
    expect(mockOnToggle).toHaveBeenCalledWith('1');
  });

  it('calls onDelete when swiped left', async () => {
    render(<TaskCatalogItem task={mockTask} onToggle={mockOnToggle} onDelete={mockOnDelete} />);

    await simulateSwipe(-(SWIPE_CONFIG.THRESHOLD_PX + 10));

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('calls onEdit when swiped right', async () => {
    render(
      <TaskCatalogItem
        task={mockTask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />,
    );

    await simulateSwipe(SWIPE_CONFIG.THRESHOLD_PX + 10);

    expect(mockOnEdit).toHaveBeenCalled();
  });

  it('supports keyboard interaction (Delete)', async () => {
    const user = userEvent.setup();
    render(<TaskCatalogItem task={mockTask} onToggle={mockOnToggle} onDelete={mockOnDelete} />);

    const item = screen.getByRole('listitem');
    item.focus();
    await user.keyboard('{Delete}');

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });
});
