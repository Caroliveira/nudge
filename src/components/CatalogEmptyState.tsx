'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { CatalogView } from '../hooks/useCatalogFilter';

interface CatalogEmptyStateProps {
  view: CatalogView;
}

const CatalogEmptyState: React.FC<CatalogEmptyStateProps> = ({ view }) => {
  const { t } = useTranslation();

  return (
    <div className="text-center py-12 px-6">
      <div className="max-w-xl mx-auto rounded-2xl border border-surface bg-surface/30 p-6">
        <p className="text-soft italic text-lg mb-2">{t('catalog.empty.quiet')}</p>
        {view === 'tasks' && (
          <p className="text-soft text-sm opacity-60">{t('catalog.empty.quietSubtitle')}</p>
        )}
      </div>
    </div>
  );
};

export default CatalogEmptyState;
