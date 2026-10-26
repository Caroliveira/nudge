'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import TaskForm from './TaskForm';
import CatalogList from './CatalogList';
import { APP_ROUTES } from '../constants';
import { Task } from '../types';
import { useStore } from '../store/useStore';
import { useTaskActions } from '../hooks/useTaskActions';

const CatalogTasks: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { tasks, addTask, updateTask, deleteTask } = useStore();
  const { toggleTask } = useTaskActions();
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleAddTask = (taskData: Omit<Task, 'id'>) => {
    addTask({ ...taskData, id: crypto.randomUUID() });
    setIsAdding(false);
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    updateTask(id, updates);
    setEditingTask(null);
  };

  if (isAdding) {
    return <TaskForm onSubmit={handleAddTask} onCancel={() => setIsAdding(false)} />;
  }

  if (editingTask) {
    return (
      <TaskForm
        initialValues={editingTask}
        onSubmit={(updates) => {
          handleUpdateTask(editingTask.id, updates);
        }}
        onCancel={() => setEditingTask(null)}
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full py-4 border-2 border-dashed border-surface rounded-2xl text-soft hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2 group"
        >
          <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {t('catalog.addPersonalTask')}
        </button>
        {tasks.length === 0 && (
          <p className="text-sm text-soft/80 text-center">
            <Trans
              i18nKey="catalog.empty.quickImportCta"
              defaults="Or <settings>go to settings</settings> and import a CSV file to make your life easier."
              components={{
                settings: (
                  <button
                    type="button"
                    onClick={() => router.push(APP_ROUTES.SETTINGS)}
                    className="underline underline-offset-4 hover:text-accent transition-colors"
                  />
                ),
              }}
            />
          </p>
        )}
      </div>

      <CatalogList
        tasks={tasks}
        view="tasks"
        onToggle={toggleTask}
        onDelete={deleteTask}
        onEdit={setEditingTask}
      />
    </>
  );
};

export default CatalogTasks;
