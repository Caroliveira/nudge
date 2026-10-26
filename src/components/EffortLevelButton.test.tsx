import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EffortLevelButton from './EffortLevelButton';
import { EffortLevel } from '../types';

describe('EffortLevelButton', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with available tasks', () => {
    render(
      <EffortLevelButton level={EffortLevel.LOW} availableCount={5} onSelect={mockOnSelect} />,
    );

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(screen.getByText('Low Effort')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Low Effort, 5 tasks available');
  });

  it('renders correctly when disabled (no tasks)', () => {
    render(
      <EffortLevelButton level={EffortLevel.HIGH} availableCount={0} onSelect={mockOnSelect} />,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-label', 'High Effort, no tasks available');
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    render(
      <EffortLevelButton level={EffortLevel.MEDIUM} availableCount={3} onSelect={mockOnSelect} />,
    );

    await user.click(screen.getByRole('button'));
    expect(mockOnSelect).toHaveBeenCalledWith(EffortLevel.MEDIUM);
  });

  it('does not call onSelect when disabled', async () => {
    const user = userEvent.setup();
    render(
      <EffortLevelButton level={EffortLevel.MEDIUM} availableCount={0} onSelect={mockOnSelect} />,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    await user.click(button).catch(() => {});

    expect(mockOnSelect).not.toHaveBeenCalled();
  });
});
