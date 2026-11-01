'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { resetPasswordAction } from '@/app/actions';
import { APP_ROUTES } from '@/constants';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage(
        t(
          'auth.invalidToken',
          'Este link de recuperação expirou ou é inválido. Solicite um novo link.',
        ),
      );
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(t('auth.passwordTooShort', 'A senha deve ter pelo menos 6 caracteres.'));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage(t('auth.passwordsDoNotMatch', 'As senhas não coincidem.'));
      return;
    }

    setStatus('loading');
    try {
      const result = await resetPasswordAction(token, newPassword);
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        if (result.error === 'invalid_token') {
          setErrorMessage(
            t(
              'auth.invalidToken',
              'Este link de recuperação expirou ou é inválido. Solicite um novo link.',
            ),
          );
        } else if (result.error === 'password_too_short') {
          setErrorMessage(t('auth.passwordTooShort', 'A senha deve ter pelo menos 6 caracteres.'));
        } else {
          setErrorMessage(
            result.error ||
              t(
                'auth.invalidToken',
                'Este link de recuperação expirou ou é inválido. Solicite um novo link.',
              ),
          );
        }
      }
    } catch {
      setStatus('error');
      setErrorMessage('Erro de conexão ao redefinir sua senha.');
    }
  };

  if (!token) {
    return (
      <section className="w-full max-w-xl mx-auto py-2 sm:py-6 fade-in">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/15 text-accent mb-4 border border-accent/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-serif text-text tracking-tight mb-2">
            {t('auth.title', 'Nudge')}
          </h1>
        </div>
        <div className="bg-surface/30 backdrop-blur-sm px-4 py-8 sm:p-10 rounded-2xl sm:rounded-3xl border border-surface shadow-sm text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-medium text-text">
            {t(
              'auth.invalidToken',
              'Este link de recuperação expirou ou é inválido. Solicite um novo link.',
            )}
          </h2>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => router.push(APP_ROUTES.LOGIN)}
              className="px-5 py-2.5 rounded-xl bg-accent text-warm font-medium hover:bg-accent/90 transition-all text-sm inline-flex items-center gap-2"
            >
              <span>{t('auth.goToLogin', 'Ir para o login')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-xl mx-auto py-2 sm:py-6 fade-in">
      {/* Header / Logo */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/15 text-accent mb-4 border border-accent/20">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-serif text-text tracking-tight mb-2">
          {t('auth.resetPasswordTitle', 'Criar nova senha')}
        </h1>
        <p className="text-soft text-sm max-w-md mx-auto px-2 sm:px-0">
          {t('auth.resetPasswordSubtitle', 'Defina uma nova senha para sua conta.')}
        </p>
      </div>

      {/* Card */}
      <div className="bg-surface/30 backdrop-blur-sm px-4 py-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-surface shadow-sm">
        {status === 'success' ? (
          <div className="text-center py-4 space-y-4 fade-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-medium text-text">
              {t('auth.resetPasswordSuccessTitle', 'Senha alterada com sucesso!')}
            </h2>
            <p className="text-soft text-sm leading-relaxed">
              {t(
                'auth.resetPasswordSuccessMessage',
                'Sua senha foi atualizada. Você já pode acessar sua conta.',
              )}
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => router.push(APP_ROUTES.LOGIN)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-accent text-warm font-medium hover:bg-accent/90 transition-all text-sm inline-flex items-center justify-center gap-2"
              >
                <span>{t('auth.goToLogin', 'Ir para o login')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 mb-2 border-b border-surface/50 text-xs text-soft">
              <KeyRound className="w-4 h-4 text-accent" />
              <span>
                {t('auth.resetPasswordSubtitle', 'Defina uma nova senha para sua conta.')}
              </span>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-medium uppercase tracking-wider text-soft mb-1.5"
              >
                {t('auth.newPasswordLabel', 'Nova senha')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-soft">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder', 'Mínimo de 6 caracteres')}
                  autoComplete="new-password"
                  disabled={status === 'loading'}
                  className="w-full pl-10 pr-11 py-3 bg-surface/50 border border-surface rounded-xl text-text placeholder:text-soft/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all text-sm disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-soft hover:text-text transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="confirmNewPassword"
                className="block text-xs font-medium uppercase tracking-wider text-soft mb-1.5"
              >
                {t('auth.confirmNewPasswordLabel', 'Confirmar nova senha')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-soft">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirmNewPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder', 'Repita sua senha')}
                  autoComplete="new-password"
                  disabled={status === 'loading'}
                  className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-surface rounded-xl text-text placeholder:text-soft/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all text-sm disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading' || !newPassword || !confirmNewPassword}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-warm font-medium hover:bg-accent/90 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {status === 'loading' ? (
                <span>{t('auth.resettingPassword', 'Salvando senha...')}</span>
              ) : (
                <>
                  <span>{t('auth.resetPasswordButton', 'Salvar nova senha')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
