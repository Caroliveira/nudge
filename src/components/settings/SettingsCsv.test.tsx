import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import SettingsCsv from './SettingsCsv';

vi.mock('@/components/CsvImport', () => ({
  default: () => <div data-testid="csv-import">Mock CsvImport</div>,
}));

vi.mock('@/components/CsvExport', () => ({
  default: () => <div data-testid="csv-export">Mock CsvExport</div>,
}));

describe('SettingsCsv', () => {
  it('renders collapsed accordion initially', () => {
    render(<SettingsCsv />);
    expect(screen.getByText('Backup & CSV')).toBeInTheDocument();
    expect(screen.queryByTestId('csv-import')).not.toBeInTheDocument();
  });

  it('expands accordion and shows CsvImport and CsvExport', async () => {
    const user = userEvent.setup();
    render(<SettingsCsv />);

    await user.click(screen.getByRole('button', { name: /Backup & CSV/i }));

    expect(screen.getByTestId('csv-import')).toBeInTheDocument();
    expect(screen.getByTestId('csv-export')).toBeInTheDocument();
  });
});
