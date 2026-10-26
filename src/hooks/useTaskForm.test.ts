import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaskForm } from './useTaskForm';
import { EffortLevel } from '../types';

describe('useTaskForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnSubmit.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useTaskForm({ onSubmit: mockOnSubmit }));

    expect(result.current.title).toBe('');
    expect(result.current.level).toBe(EffortLevel.LOW);
    expect(result.current.recurrenceUnit).toBe('none');
    expect(result.current.recurrenceInterval).toBe(1);
  });

  it('initializes with provided values', () => {
    const initialValues = {
      title: 'Test Task',
      level: EffortLevel.HIGH,
      recurrenceUnit: 'days' as const,
      recurrenceInterval: 5,
    };
    const { result } = renderHook(() => useTaskForm({ onSubmit: mockOnSubmit, initialValues }));

    expect(result.current.title).toBe('Test Task');
    expect(result.current.level).toBe(EffortLevel.HIGH);
    expect(result.current.recurrenceUnit).toBe('days');
    expect(result.current.recurrenceInterval).toBe(5);
  });

  it('validates required title', () => {
    const { result } = renderHook(() => useTaskForm({ onSubmit: mockOnSubmit }));

    act(() => {
      // Simulate form submission
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      result.current.handleSubmit(e);
    });

    expect(result.current.errors.title).toBe(true);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates recurrence interval when unit is not none', () => {
    const { result } = renderHook(() => useTaskForm({ onSubmit: mockOnSubmit }));

    act(() => {
      result.current.updateTitle('Valid Title');
      result.current.updateRecurrenceUnit('days');
      result.current.updateRecurrenceInterval(''); // Invalid
    });

    act(() => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      result.current.handleSubmit(e);
    });

    expect(result.current.errors.recurrenceInterval).toBe(true);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits successfully and resets form', async () => {
    const { result } = renderHook(() => useTaskForm({ onSubmit: mockOnSubmit }));

    act(() => {
      result.current.updateTitle('New Task');
      result.current.updateLevel(EffortLevel.MEDIUM);
    });

    act(() => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      result.current.handleSubmit(e);
    });

    expect(result.current.errors).toEqual({});
    expect(result.current.isSuccess).toBe(true);

    // Check timeout behavior
    await act(async () => {
      vi.runAllTimers();
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: 'New Task',
      level: EffortLevel.MEDIUM,
      recurrenceUnit: 'none',
      recurrenceInterval: undefined,
    });

    // Form should be reset
    expect(result.current.title).toBe('');
    expect(result.current.isSuccess).toBe(false);
  });

  it('clears errors on field update', () => {
    const { result } = renderHook(() => useTaskForm({ onSubmit: mockOnSubmit }));

    // Trigger error
    act(() => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      result.current.handleSubmit(e);
    });
    expect(result.current.errors.title).toBe(true);

    // Update field
    act(() => {
      result.current.updateTitle('A');
    });
    expect(result.current.errors.title).toBeUndefined();
  });
});
