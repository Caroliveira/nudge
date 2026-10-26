import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SwipeAction } from './TaskCatalogActions';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => (
      <div className={className} style={style} {...props} data-testid="motion-div">
        {children}
      </div>
    ),
    button: ({ children, className, style, onClick, ...props }: any) => (
      <button
        className={className}
        style={style}
        onClick={onClick}
        {...props}
        data-testid="motion-button"
      >
        {children}
      </button>
    ),
  },
  useTransform: (value: any, transform: (v: any) => any) => {
    return transform(value.get());
  },
  useMotionValueEvent: (value: any, event: string, callback: (v: any) => void) => {
    value.on(event, callback);
  },
}));

describe('SwipeAction', () => {
  const mockOnClick = vi.fn();
  let mockX: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockX = {
      get: vi.fn(),
      on: vi.fn(),
    };
  });

  it('renders with base text initially', () => {
    mockX.get.mockReturnValue(0);

    render(
      <SwipeAction
        threshold={100}
        baseText="Delete"
        activeText="Confirm"
        baseColor="red"
        activeColor="darkred"
        alignment="end"
        x={mockX}
        onClick={mockOnClick}
      />,
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('updates text when threshold is crossed', () => {
    let changeCallback: (v: number) => void = () => {};
    mockX.on.mockImplementation((event: string, cb: any) => {
      if (event === 'change') changeCallback = cb;
      return () => {};
    });
    mockX.get.mockReturnValue(0);

    render(
      <SwipeAction
        threshold={100}
        baseText="Delete"
        activeText="Confirm"
        baseColor="red"
        activeColor="darkred"
        alignment="end"
        x={mockX}
        onClick={mockOnClick}
      />,
    );

    act(() => {
      changeCallback(150);
    });

    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('reverts text when going back below threshold', () => {
    let changeCallback: (v: number) => void = () => {};
    mockX.on.mockImplementation((event: string, cb: any) => {
      if (event === 'change') changeCallback = cb;
      return () => {};
    });
    mockX.get.mockReturnValue(0);

    render(
      <SwipeAction
        threshold={100}
        baseText="Delete"
        activeText="Confirm"
        baseColor="red"
        activeColor="darkred"
        alignment="end"
        x={mockX}
        onClick={mockOnClick}
      />,
    );

    act(() => {
      changeCallback(150);
    });
    expect(screen.getByText('Confirm')).toBeInTheDocument();

    act(() => {
      changeCallback(50);
    });
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('shows success text when confirmed', () => {
    mockX.get.mockReturnValue(0);

    render(
      <SwipeAction
        threshold={100}
        baseText="Delete"
        activeText="Confirm"
        successText="Deleted!"
        baseColor="red"
        activeColor="darkred"
        alignment="end"
        x={mockX}
        onClick={mockOnClick}
        isConfirmed={true}
      />,
    );

    expect(screen.getByText('Deleted!')).toBeInTheDocument();
  });

  it('applies correct alignment classes', () => {
    mockX.get.mockReturnValue(0);

    const { rerender } = render(
      <SwipeAction
        threshold={100}
        baseText="Delete"
        activeText="Confirm"
        baseColor="red"
        activeColor="darkred"
        alignment="end"
        x={mockX}
        onClick={mockOnClick}
      />,
    );

    expect(screen.getByTestId('motion-div')).toHaveClass('justify-end');

    rerender(
      <SwipeAction
        threshold={100}
        baseText="Edit"
        activeText="Confirm"
        baseColor="blue"
        activeColor="darkblue"
        alignment="start"
        x={mockX}
        onClick={mockOnClick}
      />,
    );

    expect(screen.getByTestId('motion-div')).toHaveClass('justify-start');
  });
});
