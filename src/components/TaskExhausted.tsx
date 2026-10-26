'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface TaskExhaustedProps {
  onReset: () => void;
  onBack: () => void;
}

const TaskExhausted: React.FC<TaskExhaustedProps> = ({ onReset, onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center max-w-xl mx-auto px-6 text-center space-y-12 fade-in">
      <div className="space-y-6">
        <h2 className="text-3xl md:text-4xl text-accent serif italic">{t('exhausted.title')}</h2>
        <p className="text-md text-soft max-w-md mx-auto">{t('exhausted.subtitle')}</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
        <button
          onClick={onReset}
          className="w-full py-4 px-8 bg-accent text-warm rounded-full text-lg font-medium hover:bg-accent-dark transition-colors shadow-sm active:scale-95"
        >
          {t('exhausted.runAgain')}
        </button>
        <button
          onClick={onBack}
          className="w-full py-4 px-8 bg-transparent border-2 border-surface text-soft rounded-full text-lg font-medium hover:bg-surface hover:text-text transition-all active:scale-95"
        >
          {t('exhausted.selectOther')}
        </button>
      </div>
    </div>
  );
};

export default TaskExhausted;
