import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TotalVictory from './TotalVictory';
import { useTaskAvailability } from '../hooks/useTaskAvailability';
import { useRouter } from 'next/navigation';

vi.mock('../hooks/useTaskAvailability');
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('TotalVictory', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
  });

  it('renders victory message', () => {
    (useTaskAvailability as any).mockReturnValue({ nextRefreshDays: null });

    render(<TotalVictory />);

    expect(screen.getByText("You've completed your quest!")).toBeInTheDocument();
    expect(screen.getByText('Enjoy your rest.')).toBeInTheDocument();
  });

  it('shows next refresh info when available', () => {
    (useTaskAvailability as any).mockReturnValue({ nextRefreshDays: 2 });

    render(<TotalVictory />);

    expect(screen.getByText(/Your next set of tasks will be ready in 2 days/)).toBeInTheDocument();
  });

  it('shows singular "day" for 1 day refresh', () => {
    (useTaskAvailability as any).mockReturnValue({ nextRefreshDays: 1 });

    render(<TotalVictory />);

    expect(screen.getByText(/Your next set of tasks will be ready in 1 day/)).toBeInTheDocument();
  });

  it('does not show refresh info when null', () => {
    (useTaskAvailability as any).mockReturnValue({ nextRefreshDays: null });

    render(<TotalVictory />);

    expect(screen.queryByText(/Your next set of tasks will be ready/)).not.toBeInTheDocument();
  });

  it('navigates to catalog when adding new tasks', async () => {
    const user = userEvent.setup();
    (useTaskAvailability as any).mockReturnValue({ nextRefreshDays: null });

    render(<TotalVictory />);

    await user.click(screen.getByText('Add New Tasks'));
    expect(mockPush).toHaveBeenCalledWith('/catalog');
  });
});
