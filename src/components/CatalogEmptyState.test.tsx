import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CatalogEmptyState from './CatalogEmptyState';

describe('CatalogEmptyState', () => {
  it('renders correct message for "tasks" view', () => {
    render(<CatalogEmptyState view="tasks" />);

    expect(screen.getByText('Your catalog is quiet.')).toBeInTheDocument();
    expect(screen.getByText(/Add tasks you want to tackle later/)).toBeInTheDocument();
  });

  it('renders quiet message without subtitle for "report" view', () => {
    render(<CatalogEmptyState view="report" />);

    expect(screen.getByText('Your catalog is quiet.')).toBeInTheDocument();
    expect(screen.queryByText(/Add tasks you want to tackle later/)).not.toBeInTheDocument();
  });
});
