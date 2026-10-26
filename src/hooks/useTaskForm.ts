import { useState } from 'react';
import { Task, EffortLevel, RecurrenceUnit } from '../types';

interface UseTaskFormProps {
  onSubmit: (task: Omit<Task, 'id'>) => void;
  initialValues?: Partial<Task>;
}

export const useTaskForm = ({ onSubmit, initialValues }: UseTaskFormProps) => {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [level, setLevel] = useState<EffortLevel>(initialValues?.level || EffortLevel.LOW);
  const [recurrenceInterval, setRecurrenceInterval] = useState<number | ''>(
    initialValues?.recurrenceInterval || 1,
  );
  const [recurrenceUnit, setRecurrenceUnit] = useState<RecurrenceUnit>(
    initialValues?.recurrenceUnit || 'none',
  );
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const updateTitle = (value: string) => {
    setTitle(value);
    if (errors.title) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.title;
        return next;
      });
    }
  };

  const updateRecurrenceInterval = (value: number | '') => {
    setRecurrenceInterval(value);
    if (errors.recurrenceInterval) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.recurrenceInterval;
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuccess) return;

    const newErrors: Record<string, boolean> = {};

    if (!title.trim()) {
      newErrors.title = true;
    }

    if (recurrenceUnit !== 'none') {
      if (recurrenceInterval === '' || recurrenceInterval < 1) {
        newErrors.recurrenceInterval = true;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSuccess(true);

    setTimeout(() => {
      onSubmit({
        title,
        level,
        recurrenceInterval:
          recurrenceUnit !== 'none' && recurrenceInterval !== ''
            ? Number(recurrenceInterval)
            : undefined,
        recurrenceUnit,
      });

      // Reset form
      setTitle('');
      setRecurrenceInterval(1);
      setRecurrenceUnit('none');
      setErrors({});
      setIsSuccess(false);
    }, 1000);
  };

  return {
    title,
    updateTitle,
    level,
    updateLevel: setLevel,
    recurrenceInterval,
    updateRecurrenceInterval,
    recurrenceUnit,
    updateRecurrenceUnit: setRecurrenceUnit,
    errors,
    isSuccess,
    handleSubmit,
  };
};
