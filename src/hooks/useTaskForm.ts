import { useState } from 'react';
import { Task, EffortLevel, RecurrenceUnit } from '../types';
import { TaskFormSchema } from '../lib/schemas';

interface UseTaskFormProps {
  onSubmit: (task: Omit<Task, 'id'>) => void;
  initialValues?: Partial<Task>;
}

export const useTaskForm = ({ onSubmit, initialValues }: UseTaskFormProps) => {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [level, setLevel] = useState<EffortLevel>(initialValues?.level || EffortLevel.LOW);
  const [place, setPlace] = useState(initialValues?.place || '');
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

  const updatePlace = (value: string) => {
    setPlace(value);
    if (errors.place) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.place;
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

    const validation = TaskFormSchema.safeParse({
      title,
      place,
      level,
      recurrenceUnit,
      recurrenceInterval,
    });

    if (!validation.success) {
      const newErrors: Record<string, boolean> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as string;
        newErrors[field] = true;
      }
      setErrors(newErrors);
      return;
    }

    setIsSuccess(true);

    setTimeout(() => {
      onSubmit({
        title: title.trim(),
        level,
        place: place.trim(),
        recurrenceInterval:
          recurrenceUnit !== 'none' && recurrenceInterval !== ''
            ? Number(recurrenceInterval)
            : undefined,
        recurrenceUnit,
        createdAt: initialValues?.createdAt ?? Date.now(),
      });

      // Reset form
      setTitle('');
      setPlace('');
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
    place,
    updatePlace,
    recurrenceInterval,
    updateRecurrenceInterval,
    recurrenceUnit,
    updateRecurrenceUnit: setRecurrenceUnit,
    errors,
    isSuccess,
    handleSubmit,
  };
};
