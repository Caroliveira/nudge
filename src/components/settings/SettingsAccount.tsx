'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  ChevronDown,
  Pencil,
  Check,
  X,
  Loader2,
  LogOut,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { logoutAction, deleteAccountAction, updateUserNameAction } from '@/app/actions';
import { UpdateUserNameSchema } from '@/lib/schemas';
import { APP_ROUTES } from '@/constants';

const SettingsAccount: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const userName = useStore((state) => state.userName);
  const userEmail = useStore((state) => state.userEmail);
  const setUserName = useStore((state) => state.setUserName);
  const resetStore = useStore((state) => state.resetStore);

  const [isOpen, setIsOpen] = useState(false);

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Delete Account State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = UpdateUserNameSchema.safeParse({ newName: nameInput });
    if (!validation.success) {
      setNameError(t('auth.nameMinLength', 'O nome deve ter pelo menos 2 caracteres.'));
      return;
    }

    setIsSavingName(true);
    setNameError(null);
    try {
      const result = await updateUserNameAction(validation.data.newName);
      if (result.success && result.name) {
        setUserName(result.name);
        setIsEditingName(false);
        setNameSuccess(true);
        setTimeout(() => setNameSuccess(false), 3000);
      } else {
        setNameError(result.error || t('common.error', 'Ocorreu um erro'));
      }
    } catch {
      setNameError(t('common.error', 'Ocorreu um erro'));
    } finally {
      setIsSavingName(false);
    }
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
    <div className="bg-surface/30 p-5 sm:p-6 rounded-3xl border border-surface transition-all">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="account-accordion-content"
        className="w-full flex items-center justify-between gap-4 text-left group cursor-pointer focus:outline-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center border border-accent/20 shrink-0">
            <User className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-text">
              {t('settings.account.title', t('auth.account', 'Conta'))}
            </h2>
            <p className="text-xs text-soft truncate">
              {userEmail
                ? `${t('auth.loggedInAs', 'Conectado como')} ${userEmail}`
                : t('auth.localAccount', 'Conta local')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface text-soft border border-surface max-w-[140px] sm:max-w-[180px] truncate">
            {userName || (userEmail ? userEmail.split('@')[0] : t('auth.account', 'Conta'))}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-soft transition-transform duration-200 group-hover:text-text ${
              isOpen ? 'rotate-180 text-accent' : ''
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="account-accordion-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-5 border-t border-surface/50 mt-5">
              <div className="bg-surface/40 rounded-2xl p-4 border border-surface/60 space-y-3">
                {/* Name Field with Inline Editing */}
                <div className="space-y-1">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-soft block">
                    {t('auth.nameLabel', 'Seu nome')}
                  </span>

                  {isEditingName ? (
                    <form onSubmit={handleSaveName} className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => {
                          setNameInput(e.target.value);
                          setNameError(null);
                        }}
                        disabled={isSavingName}
                        placeholder={t('auth.namePlaceholder', 'Como prefere ser chamado(a)?')}
                        className="flex-1 px-3 py-1.5 text-sm bg-warm/80 rounded-xl border border-surface text-text focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={isSavingName || nameInput.trim().length < 2}
                        className="px-3 py-1.5 rounded-xl bg-accent text-warm hover:bg-accent/90 disabled:opacity-50 text-xs font-medium inline-flex items-center gap-1 transition-all shadow-sm"
                      >
                        {isSavingName ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>{t('auth.saveName', 'Salvar')}</span>
                      </button>
                      <button
                        type="button"
                        disabled={isSavingName}
                        onClick={() => {
                          setIsEditingName(false);
                          setNameInput(userName || '');
                          setNameError(null);
                        }}
                        className="p-1.5 rounded-xl hover:bg-surface text-soft hover:text-text transition-colors"
                        title={t('auth.cancel', 'Cancelar')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-base font-medium text-text truncate">
                        {userName || '—'}
                      </span>
                      {userEmail && (
                        <button
                          type="button"
                          onClick={() => {
                            setNameInput(userName || '');
                            setIsEditingName(true);
                            setNameError(null);
                            setNameSuccess(false);
                          }}
                          className="p-1 rounded-lg hover:bg-surface text-soft hover:text-accent transition-colors"
                          title={t('auth.editName', 'Editar nome')}
                          aria-label={t('auth.editName', 'Editar nome')}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  <AnimatePresence>
                    {nameError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs text-red-500 pt-0.5"
                      >
                        {nameError}
                      </motion.p>
                    )}
                    {nameSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg mt-1"
                      >
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>{t('auth.nameUpdated', 'Nome atualizado!')}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Email Field */}
                {userEmail && (
                  <div className="pt-2.5 border-t border-surface/50 space-y-1">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-soft block">
                      {t('auth.emailLabel', 'Seu e-mail')}
                    </span>
                    <span className="text-sm text-soft font-mono block truncate">
                      {userEmail}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Actions Row: Sign out and Delete account */}
              {userEmail && (
                <div className="pt-2 border-t border-surface/50 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface hover:border-red-500/30 text-soft hover:text-red-500 bg-surface/30 hover:bg-red-500/10 transition-all text-xs font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('auth.logout', 'Sair da conta')}</span>
                    </button>

                    {!showDeleteConfirm && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(true);
                          setDeleteError(null);
                        }}
                        className="text-xs text-soft/70 hover:text-red-500 transition-colors py-1.5 px-2 rounded-xl inline-flex items-center gap-1.5 focus:outline-none"
                        aria-label={t('auth.deleteAccount', 'Excluir conta')}
                      >
                        <Trash2 className="w-3.5 h-3.5 opacity-60" />
                        <span>{t('auth.deleteAccount', 'Excluir conta')}</span>
                      </button>
                    )}
                  </div>

                  {showDeleteConfirm && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-3 fade-in">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-text">
                            {t(
                              'auth.deleteAccountConfirmTitle',
                              'Excluir conta permanentemente?',
                            )}
                          </h4>
                          <p className="text-xs text-soft leading-relaxed">
                            {t(
                              'auth.deleteAccountConfirmMessage',
                              'Todos os seus hábitos, tarefas e histórico serão apagados definitivamente. Esta ação não pode ser desfeita.',
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
                                {t(
                                  'auth.deleteAccountConfirmButton',
                                  'Sim, excluir minha conta',
                                )}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsAccount;
