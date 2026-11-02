'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { APP_ROUTES } from '@/constants';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="min-h-[80dvh] flex flex-col items-center justify-center px-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-3xl bg-surface/60 border border-surface flex items-center justify-center text-accent mb-6 shadow-sm">
        <Compass className="w-8 h-8" aria-hidden="true" />
      </div>
      <span className="text-xs uppercase tracking-widest text-accent font-semibold mb-2">404</span>
      <h1 className="text-3xl sm:text-4xl serif text-text mb-3">
        {t('notFound.title', 'Página não encontrada')}
      </h1>
      <p className="text-sm text-soft max-w-md mb-8 leading-relaxed">
        {t(
          'notFound.subtitle',
          'O caminho que você buscou não existe ou foi movido. Respire fundo e volte ao início.',
        )}
      </p>
      <Link
        href={APP_ROUTES.HOME}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent text-warm hover:bg-accent/90 transition-all text-sm font-medium shadow-sm group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>{t('notFound.backHome', 'Voltar ao início')}</span>
      </Link>
    </main>
  );
}
