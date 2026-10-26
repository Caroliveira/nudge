'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { useTaskAvailability } from '../hooks/useTaskAvailability';
import EffortSelector from '../components/EffortSelector';
import TotalVictory from '../components/TotalVictory';
import { APP_ROUTES } from '../constants';
import AddFirstTask from '@/components/AddFirstTask';

const emptySubscribe = () => () => {};

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { tasks } = useStore();
  const { totalIncomplete } = useTaskAvailability();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <section className="w-full flex flex-col items-center">
        <EffortSelector />
      </section>
    );
  }

  if (tasks.length === 0) return <AddFirstTask />;

  if (totalIncomplete === 0) return <TotalVictory />;

  return (
    <section className="w-full flex flex-col items-center">
      <EffortSelector />
      <nav aria-label="Catalog Navigation">
        <Link
          href={APP_ROUTES.CATALOG}
          className="mt-12 text-soft hover:text-accent transition-colors flex items-center gap-2 group"
        >
          <span className="w-8 h-px bg-soft group-hover:bg-accent transition-colors" />
          {t('taskCatalog')}
          <span className="w-8 h-px bg-soft group-hover:bg-accent transition-colors" />
        </Link>
      </nav>

      <footer className="fixed bottom-8 text-center w-full z-10">
        <p className="text-xs text-soft opacity-50 uppercase tracking-widest font-medium">
          {t('footerQuote')}
        </p>
      </footer>
    </section>
  );
};

export default HomePage;
