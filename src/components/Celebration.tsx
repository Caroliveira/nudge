'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { EffortLevel } from '../types';
import { useStore } from '../store/useStore';
import { useTaskActions } from '../hooks/useTaskActions';

const LEVEL_COLORS: Record<EffortLevel, string> = {
  [EffortLevel.LOW]: 'text-accent',
  [EffortLevel.MEDIUM]: 'text-success',
  [EffortLevel.HIGH]: 'text-info',
};

const Celebration: React.FC = () => {
  const { t } = useTranslation();
  const { selectedLevel } = useStore();
  const { backToSelection } = useTaskActions();

  if (!selectedLevel) return null;

  const color = LEVEL_COLORS[selectedLevel];
  const levelKey = selectedLevel.toLowerCase();

  return (
    <div className="flex flex-col items-center justify-center max-w-xl mx-auto px-6 text-center space-y-8 fade-in">
      <div className="space-y-4">
        <div className="inline-block p-4 bg-surface rounded-full mb-4 animate-bounce">
          <svg
            className={`w-12 h-12 ${color}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className={`text-4xl md:text-5xl serif italic ${color}`}>
          {t(`celebration.${levelKey}.title`)}
        </h2>
        <p className="text-xl md:text-2xl text-text leading-relaxed">
          {t(`celebration.${levelKey}.message`)}
        </p>
      </div>

      <button
        onClick={backToSelection}
        className="w-full max-w-xs py-4 px-8 bg-text text-warm rounded-full text-lg font-medium hover:bg-muted transition-colors shadow-sm active:scale-95"
      >
        {t('celebration.backToStart')}
      </button>
    </div>
  );
};

export default Celebration;
