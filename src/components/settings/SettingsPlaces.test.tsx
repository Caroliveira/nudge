import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import SettingsPlaces from './SettingsPlaces';
import { useStore } from '@/store/useStore';

vi.mock('@/store/useStore');

describe('SettingsPlaces', () => {
  const mockAddPlace = vi.fn();
  const mockRenamePlace = vi.fn();
  const mockDeletePlace = vi.fn();

  const defaultPlaces = ['Geral', 'Cozinha'];
  const defaultTasks = [
    { id: '1', title: 'Lavar pratos', place: 'Cozinha', isCompleted: false },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as any).mockImplementation((selector?: any) => {
      const state = {
        places: defaultPlaces,
        tasks: defaultTasks,
        addPlace: mockAddPlace,
        renamePlace: mockRenamePlace,
        deletePlace: mockDeletePlace,
      };
      return selector ? selector(state) : state;
    });
  });

  it('renders collapsed accordion with place count initially', () => {
    render(<SettingsPlaces />);
    expect(screen.getByText('House Places')).toBeInTheDocument();
    expect(screen.getByText(/2 places/i)).toBeInTheDocument();
  });

  it('expands accordion when header button is clicked', async () => {
    const user = userEvent.setup();
    render(<SettingsPlaces />);

    const button = screen.getByRole('button', { name: /House Places/i });
    await user.click(button);

    expect(screen.getByPlaceholderText(/New place/i)).toBeInTheDocument();
    expect(screen.getByText('Cozinha')).toBeInTheDocument();
  });

  it('handles adding a new place successfully', async () => {
    const user = userEvent.setup();
    mockAddPlace.mockResolvedValueOnce(undefined);
    render(<SettingsPlaces />);

    await user.click(screen.getByRole('button', { name: /House Places/i }));

    const input = screen.getByPlaceholderText(/New place/i);
    await user.type(input, 'Quarto');
    await user.click(screen.getByRole('button', { name: /Add/i }));

    await waitFor(() => {
      expect(mockAddPlace).toHaveBeenCalledWith('Quarto');
    });
  });

  it('shows duplicate error when adding existing place', async () => {
    const user = userEvent.setup();
    render(<SettingsPlaces />);

    await user.click(screen.getByRole('button', { name: /House Places/i }));

    const input = screen.getByPlaceholderText(/New place/i);
    await user.type(input, 'Cozinha');
    await user.click(screen.getByRole('button', { name: /Add/i }));

    expect(screen.getByText(/This place already exists/i)).toBeInTheDocument();
    expect(mockAddPlace).not.toHaveBeenCalled();
  });

  it('opens rename form and saves new name', async () => {
    const user = userEvent.setup();
    mockRenamePlace.mockResolvedValueOnce(undefined);
    render(<SettingsPlaces />);

    await user.click(screen.getByRole('button', { name: /House Places/i }));

    const renameButtons = screen.getAllByRole('button', { name: /Rename/i });
    await user.click(renameButtons[0]);

    const editInput = screen.getByDisplayValue('Geral');
    await user.clear(editInput);
    await user.type(editInput, 'Principal');

    await user.click(screen.getByTitle(/Save/i));

    await waitFor(() => {
      expect(mockRenamePlace).toHaveBeenCalledWith('Geral', 'Principal');
    });
  });

  it('handles delete confirmation for place with tasks', async () => {
    const user = userEvent.setup();
    mockDeletePlace.mockResolvedValueOnce({ success: true });
    render(<SettingsPlaces />);

    await user.click(screen.getByRole('button', { name: /House Places/i }));

    // Delete "Cozinha" which has 1 task
    const deleteButton = screen.getByRole('button', { name: /Delete Cozinha/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/Delete Cozinha\?/i)).toBeInTheDocument();
      expect(screen.getByText(/Transfer & Delete/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Transfer & Delete/i }));

    await waitFor(() => {
      expect(mockDeletePlace).toHaveBeenCalledWith('Cozinha', 'Geral');
    });
  });
});
