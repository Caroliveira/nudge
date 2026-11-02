import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Celebration from './Celebration';
import { useStore } from '../store/useStore';
import { useTaskActions } from '../hooks/useTaskActions';
import { EffortLevel } from '../types';

vi.mock('../store/useStore');
vi.mock('../hooks/useTaskActions');

describe('Celebration', () => {
  const mockBackToSelection = vi.fn();
  const mockStore = (state: any) =>
    (useStore as any).mockImplementation((selector?: any) => (selector ? selector(state) : state));

  beforeEach(() => {
    vi.clearAllMocks();
    (useTaskActions as any).mockReturnValue({
      backToSelection: mockBackToSelection,
    });
  });

  it('renders nothing if no level selected', () => {
    mockStore({ selectedLevel: null });
    const { container } = render(<Celebration />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correct content for LOW level', () => {
    mockStore({ selectedLevel: EffortLevel.LOW });
    render(<Celebration />);

    expect(screen.getByText('Level Cleared')).toBeInTheDocument();
    expect(screen.getByText(/A steady ripple/)).toBeInTheDocument();
  });

  it('renders correct content for MEDIUM level', () => {
    mockStore({ selectedLevel: EffortLevel.MEDIUM });
    render(<Celebration />);

    expect(screen.getByText('Incredible Progress')).toBeInTheDocument();
  });

  it('renders correct content for HIGH level', () => {
    mockStore({ selectedLevel: EffortLevel.HIGH });
    render(<Celebration />);

    expect(screen.getByText('Absolute Powerhouse')).toBeInTheDocument();
  });

  it('calls backToSelection when button clicked', async () => {
    const user = userEvent.setup();
    mockStore({ selectedLevel: EffortLevel.LOW });
    render(<Celebration />);

    await user.click(screen.getByText('Back to Start'));
    expect(mockBackToSelection).toHaveBeenCalled();
  });
});
