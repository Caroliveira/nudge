'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { sendMagicLinkAction } from '@/app/actions';

export default function LoginPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === 'invalid_token'
      ? t('auth.invalidToken', 'Este link de acesso expirou ou já foi utilizado. Solicite um novo.')
      : errorParam === 'missing_token'
      ? t('auth.invalidToken', 'Link de acesso inválido. Solicite um novo.')
      : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMessage(null);

    try {
      const result = await sendMagicLinkAction(email.trim());
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(result.error || t('auth.invalidEmail', 'Erro ao enviar link.'));
      }
    } catch {
      setStatus('error');
      setErrorMessage('Erro de conexão ao enviar o link de acesso.');
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-warm text-text">
      <div className="w-full max-w-md mx-auto">
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/15 text-accent mb-4 border border-accent/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-serif text-text tracking-tight mb-2">
            {t('welcome', 'Nudge')}
          </h1>
          <p className="text-soft text-sm max-w-xs mx-auto">
            {t('auth.subtitle', 'Acesse seu espaço de tarefas com calma e sem senhas para memorizar.')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface/30 backdrop-blur-sm p-8 rounded-3xl border border-surface shadow-sm">
          {status === 'success' ? (
            <div className="text-center py-4 space-y-4 fade-in">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-medium text-text">
                {t('auth.sentTitle', 'Link de acesso enviado!')}
              </h2>
              <p className="text-soft text-sm leading-relaxed">
                {t(
                  'auth.sentMessage',
                  'Enviamos um link mágico para {{email}}. Verifique sua caixa de entrada para entrar.',
                  { email }
                )}
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStatus('idle');
                    setEmail('');
                  }}
                  className="text-xs text-soft hover:text-accent underline underline-offset-4 transition-colors"
                >
                  {t('auth.tryAnother', 'Entrar com outro e-mail')}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium uppercase tracking-wider text-soft mb-2"
                >
                  {t('auth.emailLabel', 'Seu e-mail')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-soft">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder', 'seu@email.com')}
                    autoComplete="email"
                    autoFocus
                    disabled={status === 'loading'}
                    className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-surface rounded-xl text-text placeholder:text-soft/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-warm font-medium hover:bg-accent/90 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              >
                {status === 'loading' ? (
                  <span>{t('auth.sending', 'Enviando link...')}</span>
                ) : (
                  <>
                    <span>{t('auth.sendButton', 'Receber link de acesso')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-soft pt-2">
                {t('footerQuote', 'Seja intencional com sua energia.')}
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
