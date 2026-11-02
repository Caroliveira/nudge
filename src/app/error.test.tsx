import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import GlobalError from './error';

describe('GlobalError', () => {
  it('renders error title, subtitle, and triggers reset when retry clicked', async () => {
    const user = userEvent.setup();
    const mockReset = vi.fn();
    const testError = new Error('Test crash');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<GlobalError error={testError} reset={mockReset} />);

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(
      screen.getByText(
        'A momentary error occurred while loading this page. You can try again or return home.',
      ),
    ).toBeInTheDocument();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Unhandled application error:', testError);

    const retryButton = screen.getByRole('button', { name: /Try Again/i });
    await user.click(retryButton);

    expect(mockReset).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
