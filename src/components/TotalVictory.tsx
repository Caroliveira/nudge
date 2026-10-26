'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useTaskAvailability } from '../hooks/useTaskAvailability';
import { APP_ROUTES } from '../constants';

const TotalVictory: React.FC = () => {
  const { t } = useTranslation();
  const { nextRefreshDays } = useTaskAvailability();
  const router = useRouter();

  const handleAddMore = () => router.push(APP_ROUTES.CATALOG);

  return (
    <div className="flex flex-col items-center justify-center max-w-2xl mx-auto px-6 text-center space-y-10 fade-in">
      <div className="space-y-4">
        <div className="text-6xl mb-6">✨</div>
        <h2 className="text-4xl md:text-5xl serif italic text-text">{t('victory.title')}</h2>
        <h3 className="text-2xl md:text-3xl text-accent serif italic">{t('victory.subtitle')}</h3>

        <div className="py-6">
          <p className="text-xl text-soft leading-relaxed max-w-md mx-auto">
            {t('victory.description')}
          </p>
          {nextRefreshDays !== null && (
            <div className="mt-8 p-6 bg-surface/30 rounded-2xl border border-surface fade-in">
              <p className="text-lg text-text font-medium">
                {t('victory.nextTasks', { count: nextRefreshDays })}
              </p>
              <p className="text-soft mt-1">{t('victory.comeBack')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <button
          type="button"
          onClick={handleAddMore}
          className="py-4 px-8 bg-transparent border-2 border-surface text-soft rounded-full text-lg font-medium hover:bg-surface hover:text-text transition-all active:scale-95"
        >
          {t('victory.addNew')}
        </button>
      </div>
    </div>
  );
};

export default TotalVictory;
