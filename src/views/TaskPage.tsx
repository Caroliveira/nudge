'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { useTaskActions } from '../hooks/useTaskActions';
import { useTaskSession } from '../hooks/useTaskSession';
import { useTaskAvailability } from '../hooks/useTaskAvailability';
import Celebration from '../components/Celebration';
import CompletionFeedback from '../components/CompletionFeedback';
import TaskExhausted from '../components/TaskExhausted';
import { APP_ROUTES } from '../constants';

const TaskPage: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { currentTask, selectedLevel } = useStore();
  const { markTaskDone, backToSelection } = useTaskActions();
  const { isExhausted, refreshTask, resetLevel } = useTaskSession();
  const { availableCounts } = useTaskAvailability();
  const [showCelebration, setShowCelebration] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionResult, setCompletionResult] = useState<{ levelCleared: boolean } | null>(null);

  const hasAlternatives = selectedLevel ? availableCounts[selectedLevel] > 1 : false;

  const [encouragement, setEncouragement] = useState('');

  useEffect(() => {
    if (currentTask?.id) {
      const encouragements = t('encouragements', { returnObjects: true }) as string[];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEncouragement(encouragements[Math.floor(Math.random() * encouragements.length)]);
    }
  }, [currentTask?.id, t]);

  const handleMarkDone = () => {
    const result = markTaskDone();
    setCompletionResult(result);
    setIsCompleting(true);
  };

  const handleFeedbackComplete = () => {
    if (completionResult?.levelCleared) {
      setIsCompleting(false);
      setShowCelebration(true);
    } else backToSelection();
  };

  useEffect(() => {
    if (!currentTask && !isExhausted) {
      router.push(APP_ROUTES.HOME);
    }
  }, [currentTask, isExhausted, router]);

  if (showCelebration) return <Celebration />;

  if (!currentTask && !isExhausted) return null;

  if (isExhausted) return <TaskExhausted onReset={resetLevel} onBack={backToSelection} />;

  if (!currentTask) return null;

  return (
    <>
      <AnimatePresence>
        {isCompleting && <CompletionFeedback onComplete={handleFeedbackComplete} />}
      </AnimatePresence>

      <section
        className="flex flex-col items-center justify-center max-w-xl mx-auto px-6 text-center space-y-12 fade-in"
        aria-labelledby="task-title"
      >
        <header className="space-y-6">
          <h1 id="task-title" className="text-4xl md:text-5xl text-accent serif italic">
            {currentTask.title}
          </h1>
          <p className="text-md text-soft max-w-md mx-auto italic">"{encouragement}"</p>
        </header>

        <nav
          aria-label="Task Actions"
          className="flex flex-col sm:flex-row items-center gap-4 w-full"
        >
          <button
            onClick={handleMarkDone}
            className="w-full py-4 px-8 bg-success text-warm rounded-full text-lg font-medium hover:bg-success-dark transition-colors shadow-sm active:scale-95"
          >
            {t('task.markComplete')}
          </button>
          {hasAlternatives && (
            <button
              onClick={refreshTask}
              className="w-full py-4 px-8 bg-transparent border-2 border-surface text-soft rounded-full text-lg font-medium hover:bg-surface hover:text-text transition-all active:scale-95"
            >
              {t('task.somethingElse')}
            </button>
          )}
        </nav>

        <button
          onClick={backToSelection}
          className="text-soft hover:text-accent transition-colors text-sm underline underline-offset-4"
        >
          {t('task.backToSelection')}
        </button>
      </section>
    </>
  );
};

export default TaskPage;
