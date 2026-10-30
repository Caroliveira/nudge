'use client';

import React, { useState } from 'react';
import { ArrowLeft, FileSpreadsheet, Languages, User, LogOut, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { SUPPORTED_LANGUAGES, APP_ROUTES } from '../constants';
import CsvExport from '@/components/CsvExport';
import CsvImport from '@/components/CsvImport';
import { useStore } from '@/store/useStore';
import { logoutAction, deleteAccountAction } from '@/app/actions';

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const userName = useStore((state) => state.userName);
  const userEmail = useStore((state) => state.userEmail);
  const resetStore = useStore((state) => state.resetStore);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const handleLogout = async () => {
    await logoutAction();
    resetStore();
    router.push(APP_ROUTES.LOGIN);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteAccountAction();
      if (result.success) {
        resetStore();
        router.push(APP_ROUTES.LOGIN);
      } else {
        setDeleteError(result.error || 'Failed to delete account');
      }
    } catch {
      setDeleteError('Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
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
          {userEmail && (
            <div className="pt-3 border-t border-surface/50">
              {!showDeleteConfirm ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setDeleteError(null);
                    }}
                    className="text-xs text-soft hover:text-red-500 hover:underline transition-colors py-1 px-1.5 rounded inline-flex items-center gap-1.5 focus:outline-none"
                    aria-label={t('auth.deleteAccount', 'Excluir conta')}
                  >
                    <Trash2 className="w-3.5 h-3.5 opacity-70" />
                    <span>{t('auth.deleteAccount', 'Excluir conta')}</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-3 fade-in">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-text">
                        {t('auth.deleteAccountConfirmTitle', 'Excluir conta permanentemente?')}
                      </h4>
                      <p className="text-xs text-soft leading-relaxed">
                        {t(
                          'auth.deleteAccountConfirmMessage',
                          'Todos os seus hábitos, tarefas e histórico serão apagados definitivamente. Esta ação não pode ser desfeita.'
                        )}
                      </p>
                      {deleteError && (
                        <p className="text-xs text-red-500 font-medium">{deleteError}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-xs rounded-xl border border-surface bg-surface hover:bg-surface/80 text-text transition-colors font-medium disabled:opacity-50"
                    >
                      {t('auth.cancel', 'Cancelar')}
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDeleteAccount}
                      className="px-3 py-1.5 text-xs rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors font-medium flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{t('auth.deletingAccount', 'Excluindo...')}</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>
                            {t('auth.deleteAccountConfirmButton', 'Sim, excluir minha conta')}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;
