'use client';

import React from 'react';
import { ArrowLeft, FileSpreadsheet, Languages, User, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { SUPPORTED_LANGUAGES, APP_ROUTES } from '../constants';
import CsvExport from '@/components/CsvExport';
import CsvImport from '@/components/CsvImport';
import { useStore } from '@/store/useStore';
import { logoutAction } from '@/app/actions';

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const userName = useStore((state) => state.userName);
  const userEmail = useStore((state) => state.userEmail);
  const resetStore = useStore((state) => state.resetStore);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const handleLogout = async () => {
    await logoutAction();
    resetStore();
    router.push(APP_ROUTES.LOGIN);
  };

  return (
    <section className="w-full max-w-2xl mx-auto p-6 fade-in flex flex-col h-[85dvh]">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl serif text-text">{t('settings.title')}</h1>
        <nav aria-label="Settings Back Navigation">
          <button
            onClick={() => router.back()}
            className="text-soft hover:text-accent transition-colors flex items-center gap-2 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="underline underline-offset-4">{t('settings.back')}</span>
          </button>
        </nav>
      </header>

      <div className="space-y-6">
        <div className="bg-surface/30 p-6 rounded-3xl border border-surface space-y-4">
          <section>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center border border-accent/30">
                <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-text">
                {t('settings.csv.title')}
              </h2>
            </div>
          </section>
          <section>
            <CsvImport />
          </section>
          <section>
            <CsvExport />
          </section>
        </div>

        <div className="bg-surface/30 p-6 rounded-3xl border border-surface">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center border border-accent/30">
                <Languages className="w-5 h-5" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-text">
                {t('settings.language.title')}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    i18n.resolvedLanguage === lang.code
                      ? 'bg-accent text-warm border-accent shadow-md'
                      : 'bg-surface hover:bg-surface/80 border-transparent text-text hover:shadow-sm'
                  }`}
                >
                  <div className="font-bold">{lang.label}</div>
                  {i18n.resolvedLanguage === lang.code && (
                    <div className="text-xs opacity-80 mt-1">{t('settings.language.current')}</div>
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="bg-surface/30 p-6 rounded-3xl border border-surface space-y-4">
          <section>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center border border-accent/30">
                <User className="w-5 h-5" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-text">
                {t('auth.account', 'Conta')}
              </h2>
            </div>
          </section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <span className="text-xs uppercase tracking-wider text-soft block">
                {t('auth.loggedInAs', 'Conectado como')}
              </span>
              <span className="text-text font-medium text-sm">
                {userName ? `${userName} (${userEmail})` : userEmail || 'Conta local'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('auth.logout', 'Sair da conta')}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;
