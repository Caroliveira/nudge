import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import NotFound from './not-found';

describe('NotFound', () => {
  it('renders 404 badge, title, subtitle and back link', () => {
    render(<NotFound />);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(
      screen.getByText(
        "The path you were looking for doesn't exist or has moved. Take a gentle breath and return home.",
      ),
    ).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /Back to Home/i });
    expect(link).toHaveAttribute('href', '/');
  });
});
