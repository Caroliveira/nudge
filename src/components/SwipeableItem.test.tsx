import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SwipeableItem from './SwipeableItem';
import { motion, PanInfo, HTMLMotionProps, animate } from 'framer-motion';
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

describe('SwipeableItem', () => {
  const mockOnSwipeLeft = vi.fn();
  const mockOnSwipeRight = vi.fn();
  const defaultProps = {
    onSwipeLeft: mockOnSwipeLeft,
    onSwipeRight: mockOnSwipeRight,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(
        <SwipeableItem {...defaultProps}>
          <div>Test Content</div>
        </SwipeableItem>,
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Drag Interactions', () => {
    const simulateDragEnd = async (offsetX: number) => {
      const mockMotionDiv = vi.mocked(motion.div);
      const props = mockMotionDiv.mock.lastCall?.[0] as HTMLMotionProps<'div'>;
      const onDragEnd = props.onDragEnd;

      if (!onDragEnd) throw new Error('onDragEnd not defined on motion.div');

      await act(async () => {
        await onDragEnd({} as any, { offset: { x: offsetX, y: 0 } } as PanInfo);
      });
    };

    it('triggers onSwipeLeft when dragged past negative threshold', async () => {
      render(
        <SwipeableItem {...defaultProps}>
          <div>Content</div>
        </SwipeableItem>,
      );

      await simulateDragEnd(-(SWIPE_CONFIG.THRESHOLD_PX + 10));

      expect(mockOnSwipeLeft).toHaveBeenCalled();
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
      expect(animate).toHaveBeenCalledWith(
        expect.anything(),
        -window.innerWidth,
        expect.anything(),
      );
    });

    it('triggers onSwipeRight when dragged past positive threshold', async () => {
      render(
        <SwipeableItem {...defaultProps}>
          <div>Content</div>
        </SwipeableItem>,
      );

      await simulateDragEnd(SWIPE_CONFIG.THRESHOLD_PX + 10);

      expect(mockOnSwipeRight).toHaveBeenCalled();
      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(animate).toHaveBeenCalledWith(expect.anything(), 0, expect.anything());
    });

    it('does not trigger actions when drag is within threshold', async () => {
      render(
        <SwipeableItem {...defaultProps}>
          <div>Content</div>
        </SwipeableItem>,
      );

      await simulateDragEnd(SWIPE_CONFIG.THRESHOLD_PX - 10);

      expect(mockOnSwipeRight).not.toHaveBeenCalled();
      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Interactions', () => {
    it('triggers onSwipeLeft on Delete key', async () => {
      const user = userEvent.setup();
      render(
        <SwipeableItem {...defaultProps}>
          <div>Content</div>
        </SwipeableItem>,
      );

      const element = screen.getByRole('listitem');
      element.focus();
      await user.keyboard('{Delete}');

      expect(mockOnSwipeLeft).toHaveBeenCalled();
    });

    it('triggers onSwipeRight on Enter key', async () => {
      const user = userEvent.setup();
      render(
        <SwipeableItem {...defaultProps}>
          <div>Content</div>
        </SwipeableItem>,
      );

      const element = screen.getByRole('listitem');
      element.focus();
      await user.keyboard('{Enter}');

      expect(mockOnSwipeRight).toHaveBeenCalled();
    });
  });
});
