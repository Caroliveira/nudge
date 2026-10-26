import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CatalogPage from './CatalogPage';

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/catalog',
  useSearchParams: () => mockSearchParams,
}));

vi.mock('../hooks/useTaskActions', () => ({
  useTaskActions: () => ({
    backToSelection: vi.fn(),
  }),
}));

vi.mock('../components/CatalogTasks', () => ({
  default: () => <div data-testid="catalog-tasks-panel">Tasks Panel</div>,
}));

vi.mock('../components/CatalogReport', () => ({
  default: () => <div data-testid="catalog-report">Report</div>,
}));

describe('CatalogPage query-tab sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('starts in report view from URL query', () => {
    mockSearchParams = new URLSearchParams('view=report');

    render(<CatalogPage />);

    expect(screen.getByTestId('catalog-report')).toBeInTheDocument();
    expect(screen.queryByTestId('catalog-tasks-panel')).not.toBeInTheDocument();
  });

  it('updates URL when switching tabs', () => {
    mockSearchParams = new URLSearchParams();

    render(<CatalogPage />);

    expect(screen.getByTestId('catalog-tasks-panel')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /report/i }));
    expect(mockReplace).toHaveBeenCalledWith('/catalog?view=report');

    // Simulate clicking tasks tab
    mockSearchParams = new URLSearchParams('view=report');
    fireEvent.click(screen.getByRole('tab', { name: /tasks/i }));
    expect(mockReplace).toHaveBeenCalledWith('/catalog');
  });
});
