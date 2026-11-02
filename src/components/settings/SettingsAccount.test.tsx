import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import SettingsAccount from './SettingsAccount';
import { useStore } from '@/store/useStore';
import { logoutAction, deleteAccountAction, updateUserNameAction } from '@/app/actions';

vi.mock('@/store/useStore');
vi.mock('@/app/actions', () => ({
  logoutAction: vi.fn(),
  deleteAccountAction: vi.fn(),
  updateUserNameAction: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
  }),
}));

describe('SettingsAccount', () => {
  const mockSetUserName = vi.fn();
  const mockResetStore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as any).mockImplementation((selector?: any) => {
      const state = {
        userName: 'Lina Oliveira',
        userEmail: 'lina@example.com',
        setUserName: mockSetUserName,
        resetStore: mockResetStore,
      };
      return selector ? selector(state) : state;
    });
  });

  it('renders collapsed accordion with user info', () => {
    render(<SettingsAccount />);
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Lina Oliveira')).toBeInTheDocument();
  });

  it('expands accordion and allows inline name editing', async () => {
    const user = userEvent.setup();
    (updateUserNameAction as any).mockResolvedValueOnce({
      success: true,
      name: 'Lina New',
    });

    render(<SettingsAccount />);

    await user.click(screen.getByRole('button', { name: /Account/i }));

    expect(screen.getByText('lina@example.com')).toBeInTheDocument();

    const editNameBtn = screen.getByRole('button', { name: /Edit name/i });
    await user.click(editNameBtn);

    const nameInput = screen.getByDisplayValue('Lina Oliveira');
    await user.clear(nameInput);
    await user.type(nameInput, 'Lina New');

    await user.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(updateUserNameAction).toHaveBeenCalledWith('Lina New');
      expect(mockSetUserName).toHaveBeenCalledWith('Lina New');
    });
  });

  it('handles logout action', async () => {
    const user = userEvent.setup();
    (logoutAction as any).mockResolvedValueOnce(undefined);

    render(<SettingsAccount />);

    await user.click(screen.getByRole('button', { name: /Account/i }));

    const logoutBtn = screen.getByRole('button', { name: /Sign out/i });
    await user.click(logoutBtn);

    await waitFor(() => {
      expect(logoutAction).toHaveBeenCalled();
      expect(mockResetStore).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('handles delete account flow', async () => {
    const user = userEvent.setup();
    (deleteAccountAction as any).mockResolvedValueOnce({ success: true });

    render(<SettingsAccount />);

    await user.click(screen.getByRole('button', { name: /Account/i }));

    const deleteAccountTrigger = screen.getByRole('button', { name: /Delete account/i });
    await user.click(deleteAccountTrigger);

    expect(
      screen.getByText(/Delete account permanently\?/i),
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', {
      name: /Yes, delete my account/i,
    });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(deleteAccountAction).toHaveBeenCalled();
      expect(mockResetStore).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('cancels edit name and handles error when saving name fails', async () => {
    const user = userEvent.setup();
    (updateUserNameAction as any).mockRejectedValueOnce(new Error('Network error'));

    render(<SettingsAccount />);
    await user.click(screen.getByRole('button', { name: /Account/i }));

    const editNameBtn = screen.getByRole('button', { name: /Edit name/i });
    await user.click(editNameBtn);

    // Cancel editing
    const cancelBtn = screen.getByTitle(/Cancel/i);
    await user.click(cancelBtn);
    expect(screen.queryByDisplayValue('Lina Oliveira')).not.toBeInTheDocument();

    // Re-open and submit error
    await user.click(screen.getByRole('button', { name: /Edit name/i }));
    const nameInput = screen.getByDisplayValue('Lina Oliveira');
    await user.type(nameInput, ' Test');
    await user.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(screen.getByText(/An error occurred/i)).toBeInTheDocument();
    });
  });

  it('cancels delete account and handles delete failure', async () => {
    const user = userEvent.setup();
    (deleteAccountAction as any).mockResolvedValueOnce({
      success: false,
      error: 'Delete rejected',
    });

    render(<SettingsAccount />);
    await user.click(screen.getByRole('button', { name: /Account/i }));

    await user.click(screen.getByRole('button', { name: /Delete account/i }));

    // Cancel deletion
    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(
      screen.queryByText(/Delete account permanently\?/i),
    ).not.toBeInTheDocument();

    // Re-trigger and fail
    await user.click(screen.getByRole('button', { name: /Delete account/i }));
    await user.click(screen.getByRole('button', { name: /Yes, delete my account/i }));

    await waitFor(() => {
      expect(screen.getByText('Delete rejected')).toBeInTheDocument();
    });
  });
});
