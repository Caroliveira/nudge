'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCatalogStats } from '../hooks/useCatalogStats';
import TodaysActivity from './CatalogReportActivity';
import CatalogHealth from './CatalogReportHealth';
import { useStore } from '../store/useStore';

const CatalogReport: React.FC = () => {
  const { t } = useTranslation();
  const { tasks, currentStreak, bestStreak } = useStore();
  const stats = useCatalogStats(tasks, { currentStreak, bestStreak });

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 px-6 animate-fade-in bg-surface/10 rounded-3xl border border-surface/20 border-dashed">
        <p className="text-soft italic text-lg mb-2">{t('report.noData')}</p>
        <p className="text-soft text-sm opacity-60">{t('report.addTasks')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <TodaysActivity stats={stats} />
      <CatalogHealth stats={stats} />
    </div>
  );
};

export default CatalogReport;
