'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Task, EffortLevel, RecurrenceUnit } from '../types';
import { useTaskForm } from '../hooks/useTaskForm';

interface TaskFormProps {
  onSubmit: (task: Omit<Task, 'id'>) => void;
  onCancel: () => void;
  initialValues?: Partial<Task>;
}

const shakeAnimation = {
  x: [0, -4, 4, -4, 4, 0],
  transition: { duration: 0.4 },
};

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, onCancel, initialValues }) => {
  const { t } = useTranslation();
  const {
    title,
    updateTitle,
    level,
    updateLevel,
    recurrenceInterval,
    updateRecurrenceInterval,
    recurrenceUnit,
    updateRecurrenceUnit,
    errors,
    isSuccess,
    handleSubmit,
  } = useTaskForm({ onSubmit, initialValues });

  if (isSuccess) {
    return (
      <div className="bg-surface p-6 rounded-2xl flex flex-col items-center justify-center min-h-[300px] fade-in border border-soft/20 shadow-sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="text-success text-6xl mb-4"
        >
          <Check className="w-16 h-16" />
        </motion.div>
        <h3 className="text-2xl font-bold text-text">
          {initialValues ? t('form.successUpdate') : t('form.successSave')}
        </h3>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface p-6 rounded-2xl space-y-6 fade-in border border-soft/20 shadow-sm"
      aria-label={initialValues ? t('form.update') : t('catalog.addPersonalTask')}
    >
      <div>
        <label
          htmlFor="task-title"
          className="block text-xs uppercase tracking-widest text-soft mb-2 font-bold"
        >
          {t('form.title')}
        </label>
        <motion.input
          id="task-title"
          autoFocus
          animate={errors.title ? shakeAnimation : {}}
          className={`w-full bg-warm border-none rounded-lg p-3 text-text focus:ring-2 outline-none text-lg ${
            errors.title ? 'ring-2 ring-red-700' : 'focus:ring-accent'
          }`}
          value={title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder={t('form.placeholder')}
          aria-invalid={!!errors.title}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="task-effort"
            className="block text-xs uppercase tracking-widest text-soft mb-2 font-bold"
          >
            {t('form.effort')}
          </label>
          <select
            id="task-effort"
            className="w-full bg-warm border-none rounded-lg p-3 text-text focus:ring-2 focus:ring-accent outline-none appearance-none"
            value={level}
            onChange={(e) => updateLevel(e.target.value as EffortLevel)}
          >
            {Object.values(EffortLevel).map((l) => (
              <option key={l} value={l}>
                {t(`effort.${l.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="task-recurrence-unit"
            className="block text-xs uppercase tracking-widest text-soft mb-2 font-bold"
          >
            {t('form.recurrence')}
          </label>
          <div className="flex gap-2">
            {recurrenceUnit !== 'none' && (
              <motion.input
                id="task-recurrence-interval"
                type="number"
                min={1}
                animate={errors.recurrenceInterval ? shakeAnimation : {}}
                className={`w-20 bg-warm border-none rounded-lg p-3 text-text focus:ring-2 outline-none ${
                  errors.recurrenceInterval ? 'ring-2 ring-red-700' : 'focus:ring-accent'
                }`}
                value={recurrenceInterval}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    updateRecurrenceInterval('');
                  } else {
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed)) {
                      updateRecurrenceInterval(parsed);
                    }
                  }
                }}
                aria-label="Recurrence interval"
                aria-invalid={!!errors.recurrenceInterval}
              />
            )}
            <select
              id="task-recurrence-unit"
              className="flex-1 bg-warm border-none rounded-lg p-3 text-text focus:ring-2 focus:ring-accent outline-none appearance-none"
              value={recurrenceUnit}
              onChange={(e) => updateRecurrenceUnit(e.target.value as RecurrenceUnit)}
            >
              <option value="none">{t('form.units.none')}</option>
              <option value="days">{t('form.units.days')}</option>
              <option value="weeks">{t('form.units.weeks')}</option>
              <option value="months">{t('form.units.months')}</option>
              <option value="years">{t('form.units.years')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          className="flex-2 bg-success text-warm py-4 rounded-xl hover:bg-success-dark transition-all font-bold text-lg shadow-md active:scale-95"
        >
          {initialValues ? t('form.update') : t('form.save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-soft/10 text-soft py-4 rounded-xl hover:bg-soft/20 transition-all font-medium active:scale-95"
        >
          {t('form.cancel')}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
