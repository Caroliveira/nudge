import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import SettingsLanguage from './SettingsLanguage';
import { useTranslation } from 'react-i18next';

describe('SettingsLanguage', () => {
  it('renders collapsed accordion with current language label', () => {
    render(<SettingsLanguage />);
    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('expands accordion and allows changing language', async () => {
    const user = userEvent.setup();
    const { i18n } = useTranslation();

    render(<SettingsLanguage />);

    await user.click(screen.getByRole('button', { name: /Language/i }));

    expect(screen.getByText('Português')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();

    await user.click(screen.getByText('Português'));
    expect(i18n.changeLanguage).toHaveBeenCalledWith('pt');
  });
});
