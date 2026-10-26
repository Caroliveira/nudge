'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { EffortLevel, RecurrenceUnit } from '../types';
import { EFFORT_COLORS, RECURRENCE_LABELS } from '../constants';

interface TodaysActivityProps {
  stats: {
    hasActivityToday: boolean;
    effortDist: Record<EffortLevel, number>;
    recurrenceDist: Record<RecurrenceUnit, number>;
  };
}

const TodaysActivity: React.FC<TodaysActivityProps> = ({ stats }) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'effort' | 'recurrence'>('effort');

  return (
    <div className="bg-surface/20 p-6 rounded-3xl border border-surface">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-sm uppercase tracking-widest text-soft font-bold">
            {t('report.activity')}
          </h3>
          <p className="text-xs text-soft/60 mt-1">{t('report.activitySubtitle')}</p>
        </div>

        {/* Accessible Toggle */}
        <div
          className="flex bg-surface/50 rounded-lg p-1 self-start sm:self-auto relative"
          role="tablist"
          aria-label={t('report.viewMode')}
        >
          <button
            role="tab"
            aria-selected={viewMode === 'effort'}
            onClick={() => setViewMode('effort')}
            className={`relative px-3 py-1.5 text-xs font-bold rounded-md transition-colors z-10 ${
              viewMode === 'effort' ? 'text-text' : 'text-soft hover:text-text'
            }`}
          >
            {viewMode === 'effort' && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white/70 shadow-sm rounded-md"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                style={{ zIndex: -1 }}
              />
            )}
            {t('report.effort')}
          </button>
          <button
            role="tab"
            aria-selected={viewMode === 'recurrence'}
            onClick={() => setViewMode('recurrence')}
            className={`relative px-3 py-1.5 text-xs font-bold rounded-md transition-colors z-10 ${
              viewMode === 'recurrence' ? 'text-text' : 'text-soft hover:text-text'
            }`}
          >
            {viewMode === 'recurrence' && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white/70 shadow-sm rounded-md"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                style={{ zIndex: -1 }}
              />
            )}
            {t('report.recurrence')}
          </button>
        </div>
      </div>

      {!stats.hasActivityToday ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8 border-2 border-dashed border-surface/30 rounded-2xl"
        >
          <p className="text-soft italic">{t('report.noActivity')}</p>
          <p className="text-xs text-soft/50 mt-1">{t('report.checkOff')}</p>
        </motion.div>
      ) : (
        <div className="w-full">
          <AnimatePresence mode="wait">
            {viewMode === 'effort' ? (
              <motion.div
                key="effort-view"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-wrap gap-3"
              >
                {Object.values(EffortLevel).map((level) => {
                  const count = stats.effortDist[level];
                  if (count === 0) return null; // Hide empty stats to reduce noise

                  return (
                    <motion.div
                      key={level}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex-1 min-w-[100px] flex flex-col items-center justify-center p-4 bg-white/60 rounded-2xl border border-white/50 shadow-sm"
                    >
                      <span
                        className={`text-3xl font-black ${EFFORT_COLORS[level].split(' ')[0]} mb-1`}
                      >
                        {count}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-soft font-bold">
                        {t(`effort.short.${level.toLowerCase()}`)}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="recurrence-view"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-wrap gap-3"
              >
                {(Object.keys(RECURRENCE_LABELS) as RecurrenceUnit[])
                  .filter((unit) => stats.recurrenceDist[unit] > 0)
                  .map((unit) => {
                    const count = stats.recurrenceDist[unit];

                    return (
                      <motion.div
                        key={unit}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex-1 min-w-[100px] flex flex-col items-center justify-center p-4 bg-white/60 rounded-2xl border border-white/50 shadow-sm"
                      >
                        <span className="text-3xl font-black text-text mb-1">{count}</span>
                        <span className="text-xs uppercase tracking-wider text-soft font-bold">
                          {t(`recurrence.${unit}`)}
                        </span>
                      </motion.div>
                    );
                  })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default TodaysActivity;
