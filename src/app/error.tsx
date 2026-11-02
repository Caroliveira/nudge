'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { APP_ROUTES } from '@/constants';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <main className="min-h-[80dvh] flex flex-col items-center justify-center px-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-6 shadow-sm">
        <AlertTriangle className="w-8 h-8" aria-hidden="true" />
      </div>
      <span className="text-xs uppercase tracking-widest text-red-500 font-semibold mb-2">
        {t('common.error', 'Erro')}
      </span>
      <h1 className="text-3xl sm:text-4xl serif text-text mb-3">
        {t('error.title', 'Algo inesperado aconteceu')}
      </h1>
      <p className="text-sm text-soft max-w-md mb-8 leading-relaxed">
        {t(
          'error.subtitle',
          'Um erro momentâneo ocorreu ao carregar a página. Você pode tentar novamente ou retornar ao início.',
        )}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent text-warm hover:bg-accent/90 transition-all text-sm font-medium shadow-sm cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t('error.retry', 'Tentar novamente')}</span>
        </button>
        <Link
          href={APP_ROUTES.HOME}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-surface bg-surface/50 hover:bg-surface text-text transition-all text-sm font-medium"
        >
          <Home className="w-4 h-4 text-soft" />
          <span>{t('error.backHome', 'Início')}</span>
        </Link>
      </div>
    </main>
  );
}
