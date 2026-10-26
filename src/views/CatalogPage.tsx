'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTaskActions } from '../hooks/useTaskActions';
import { CatalogView } from '../hooks/useCatalogFilter';
import CatalogTabs from '../components/CatalogTabs';
import CatalogReport from '../components/CatalogReport';
import CatalogTasks from '../components/CatalogTasks';

const CatalogPage: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { backToSelection } = useTaskActions();
  const view: CatalogView = searchParams?.get('view') === 'report' ? 'report' : 'tasks';

  const handleTabChange = (newView: CatalogView) => {
    const nextParams = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (newView === 'report') {
      nextParams.set('view', 'report');
    } else {
      nextParams.delete('view');
    }
    const query = nextParams.toString();
    const targetPath = pathname ?? '/catalog';
    router.replace(query ? `${targetPath}?${query}` : targetPath);
  };

  return (
    <section className="w-full max-w-2xl mx-auto p-6 fade-in flex flex-col h-[85dvh]">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl serif text-text">{t('catalog.title')}</h1>
        <nav aria-label="Catalog Back Navigation">
          <button
            type="button"
            onClick={backToSelection}
            className="text-soft hover:text-accent transition-colors flex items-center gap-2 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="underline underline-offset-4">{t('catalog.back')}</span>
          </button>
        </nav>
      </header>

      <CatalogTabs view={view} onViewChange={handleTabChange} />

      <div
        id="catalog-panel"
        role="tabpanel"
        aria-labelledby={`tab-${view}`}
        className="flex-1 overflow-y-auto pr-2 space-y-6 px-1"
      >
        {view === 'report' ? <CatalogReport /> : <CatalogTasks />}
      </div>
    </section>
  );
};

export default CatalogPage;
