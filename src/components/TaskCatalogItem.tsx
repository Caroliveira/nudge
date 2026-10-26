'use client';

import React from 'react';
import { Check, ChevronLeft } from 'lucide-react';
import { MotionValue } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Task } from '../types';
import { SWIPE_ACTIONS } from '../constants';
import SwipeableItem from './SwipeableItem';
import { SwipeAction } from './TaskCatalogActions';

interface TaskCatalogItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: () => void;
}

const TaskCatalogItem: React.FC<TaskCatalogItemProps> = ({ task, onToggle, onDelete, onEdit }) => {
  const { t } = useTranslation();

  const deleteAction = {
    ...SWIPE_ACTIONS.DELETE,
    baseText: t(SWIPE_ACTIONS.DELETE.baseText),
    activeText: t(SWIPE_ACTIONS.DELETE.activeText),
    successText: t(SWIPE_ACTIONS.DELETE.successText),
  };

  const editAction = {
    ...SWIPE_ACTIONS.EDIT,
    baseText: t(SWIPE_ACTIONS.EDIT.baseText),
    activeText: t(SWIPE_ACTIONS.EDIT.activeText),
    successText: t(SWIPE_ACTIONS.EDIT.successText),
  };

  const renderDeleteAction = (x: MotionValue<number>, isConfirmed: boolean) => (
    <SwipeAction
      x={x}
      onClick={() => onDelete(task.id)}
      {...deleteAction}
      isConfirmed={isConfirmed}
    />
  );

  const renderEditAction = (x: MotionValue<number>, isConfirmed: boolean) => (
    <SwipeAction x={x} onClick={() => onEdit?.()} {...editAction} isConfirmed={isConfirmed} />
  );

  return (
    <SwipeableItem
      className="mb-3"
      onSwipeLeft={() => onDelete(task.id)}
      renderRightBackground={renderDeleteAction}
      onSwipeRight={onEdit}
      renderLeftBackground={onEdit ? renderEditAction : undefined}
    >
      <div
        className={`flex items-center gap-4 p-4 rounded-xl transition-transform duration-200 ease-out border ${
          task.isCompleted ? 'bg-warm border-surface' : 'bg-surface border-transparent shadow-sm'
        }`}
      >
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
            task.isCompleted
              ? 'bg-accent border-accent text-warm opacity-50'
              : 'border-soft hover:border-accent bg-warm'
          }`}
          aria-label={task.isCompleted ? t('task.markAsIncomplete') : t('task.markAsComplete')}
        >
          {task.isCompleted && <Check className="w-4 h-4 text-warm" />}
        </button>

        <div
          className={`flex-1 min-w-0 pointer-events-none ${task.isCompleted ? 'opacity-50' : ''}`}
        >
          <h4
            className={`font-medium truncate ${task.isCompleted ? 'line-through text-soft' : 'text-text'}`}
          >
            {task.title}
          </h4>
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-tighter text-soft mt-1">
            <span className="font-bold">{t(`effort.${task.level.toLowerCase()}`)}</span>
            {task.recurrenceUnit && task.recurrenceUnit !== 'none' && (
              <span className="px-1.5 py-0.5 bg-warm rounded italic">
                {t(`recurrence.every.${task.recurrenceUnit}`, { count: task.recurrenceInterval })}
              </span>
            )}
          </div>
        </div>

        {/* Slide hint (optional) */}
        <div className="text-soft opacity-20">
          <ChevronLeft className="w-6 h-6" />
        </div>
      </div>
    </SwipeableItem>
  );
};

export default TaskCatalogItem;
