'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CatalogView } from '../hooks/useCatalogFilter';

interface CatalogTabsProps {
  view: CatalogView;
  onViewChange: (view: CatalogView) => void;
}

const CatalogTabs: React.FC<CatalogTabsProps> = ({ view, onViewChange }) => {
  const { t } = useTranslation();

  return (
    <nav
      className="bg-surface/30 p-1.5 rounded-2xl flex items-center mb-8 relative"
      role="tablist"
      aria-label="Catalog views"
    >
      <button
        onClick={() => onViewChange('tasks')}
        role="tab"
        aria-selected={view === 'tasks'}
        aria-controls="catalog-panel"
        id="tab-tasks"
        className={`flex-1 relative py-3 text-sm font-bold rounded-xl transition-colors z-10 ${
          view === 'tasks' ? 'text-text' : 'text-soft hover:text-text/80'
        }`}
      >
        {view === 'tasks' && (
          <motion.div
            layoutId="activeCatalogTab"
            className="absolute inset-0 bg-white/70 shadow-sm rounded-xl"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            style={{ zIndex: -1 }}
          />
        )}
        {t('catalog.tabs.tasks')}
      </button>

      <button
        onClick={() => onViewChange('report')}
        role="tab"
        aria-selected={view === 'report'}
        aria-controls="catalog-panel"
        id="tab-report"
        className={`flex-1 relative py-3 text-sm font-bold rounded-xl transition-colors z-10 ${
          view === 'report' ? 'text-text' : 'text-soft hover:text-text/80'
        }`}
      >
        {view === 'report' && (
          <motion.div
            layoutId="activeCatalogTab"
            className="absolute inset-0 bg-white/70 shadow-sm rounded-xl"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            style={{ zIndex: -1 }}
          />
        )}
        {t('catalog.tabs.report')}
      </button>
    </nav>
  );
};

export default CatalogTabs;
